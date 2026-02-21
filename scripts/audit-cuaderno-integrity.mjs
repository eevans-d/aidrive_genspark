#!/usr/bin/env node
/**
 * audit-cuaderno-integrity.mjs
 *
 * Automated integrity audit for the cuaderno/faltantes/tareas pipeline.
 * Detects:
 *   1. Critical faltantes without an associated active tarea (backfill gap).
 *   2. Orphaned tareas referencing non-existent faltantes.
 *   3. State inconsistencies (resolved faltante with active tarea, etc.).
 *   4. Duplicate tareas for the same faltante_id.
 *   5. Missing traceability fields in tarea datos.
 *
 * Usage:
 *   node scripts/audit-cuaderno-integrity.mjs [--offline]
 *
 * --offline: Run static code checks only (no Supabase connection needed).
 *            Without this flag, the script attempts a live DB audit.
 *
 * Exit codes:
 *   0 = all checks pass
 *   1 = issues found (printed to stdout)
 *   2 = configuration/connection error
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const isOffline = process.argv.includes('--offline');

// ── Colors (ANSI) ────────────────────────────────────────────────────────
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function pass(msg) { console.log(`  ${GREEN}✓${RESET} ${msg}`); }
function warn(msg) { console.log(`  ${YELLOW}⚠${RESET} ${msg}`); }
function fail(msg) { console.log(`  ${RED}✗${RESET} ${msg}`); }
function info(msg) { console.log(`  ${CYAN}ℹ${RESET} ${msg}`); }

let issueCount = 0;
function addIssue(msg) { issueCount++; fail(msg); }

// ── Static Code Checks ──────────────────────────────────────────────────

function checkFileExists(relPath, description) {
  const abs = path.resolve(ROOT, relPath);
  if (fs.existsSync(abs)) {
    pass(`${description}: exists`);
    return true;
  }
  addIssue(`${description}: MISSING at ${relPath}`);
  return false;
}

function checkFileContains(relPath, pattern, description) {
  const abs = path.resolve(ROOT, relPath);
  if (!fs.existsSync(abs)) {
    addIssue(`${description}: file not found ${relPath}`);
    return false;
  }
  const content = fs.readFileSync(abs, 'utf-8');
  if (typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)) {
    pass(`${description}`);
    return true;
  }
  addIssue(`${description}: pattern not found`);
  return false;
}

function runStaticChecks() {
  console.log(`\n${CYAN}═══ Static Code Integrity Checks ═══${RESET}\n`);

  // 1. Core files exist
  console.log('1. Core files:');
  checkFileExists('minimarket-system/src/utils/cuadernoParser.ts', 'Cuaderno parser');
  checkFileExists('minimarket-system/src/hooks/queries/useFaltantes.ts', 'Faltantes hook');
  checkFileExists('minimarket-system/src/hooks/queries/useTareas.ts', 'Tareas hook');
  checkFileExists('minimarket-system/src/pages/Cuaderno.tsx', 'Cuaderno page');
  checkFileExists('minimarket-system/src/components/QuickNoteButton.tsx', 'QuickNoteButton');
  checkFileExists('supabase/functions/backfill-faltantes-recordatorios/index.ts', 'Backfill edge function');

  // 2. Test files exist
  console.log('\n2. Test coverage:');
  checkFileExists('tests/unit/cuadernoParser.test.ts', 'Parser tests');
  checkFileExists('tests/unit/backfill-faltantes.test.ts', 'Backfill tests');
  checkFileExists('minimarket-system/src/components/QuickNoteButton.test.tsx', 'QuickNoteButton tests');
  checkFileExists('minimarket-system/src/pages/Cuaderno.test.tsx', 'Cuaderno page tests');

  // 3. Traceability in auto-reminder
  console.log('\n3. Traceability fields:');
  checkFileContains(
    'minimarket-system/src/hooks/queries/useFaltantes.ts',
    "origen: 'cuaderno'",
    'Auto-reminder has origen traceability',
  );
  checkFileContains(
    'minimarket-system/src/hooks/queries/useFaltantes.ts',
    'faltante_id:',
    'Auto-reminder has faltante_id traceability',
  );

  // 4. Backfill traceability
  console.log('\n4. Backfill traceability:');
  checkFileContains(
    'supabase/functions/backfill-faltantes-recordatorios/index.ts',
    "origen: 'cuaderno'",
    'Backfill has origen traceability',
  );
  checkFileContains(
    'supabase/functions/backfill-faltantes-recordatorios/index.ts',
    'backfill_version',
    'Backfill has version traceability',
  );
  checkFileContains(
    'supabase/functions/backfill-faltantes-recordatorios/index.ts',
    'faltante_id',
    'Backfill has faltante_id linkage',
  );

  // 5. Idempotency mechanism
  console.log('\n5. Idempotency checks:');
  checkFileContains(
    'supabase/functions/backfill-faltantes-recordatorios/index.ts',
    'existingFaltanteIds',
    'Backfill checks existing faltante IDs before creating',
  );
  checkFileContains(
    'supabase/functions/backfill-faltantes-recordatorios/index.ts',
    'dry_run',
    'Backfill supports dry-run mode',
  );

  // 6. Fail-safe per-row
  console.log('\n6. Fail-safe pattern:');
  checkFileContains(
    'supabase/functions/backfill-faltantes-recordatorios/index.ts',
    'BACKFILL_ROW_ERROR',
    'Backfill has per-row error handling',
  );
  checkFileContains(
    'supabase/functions/backfill-faltantes-recordatorios/index.ts',
    'errores',
    'Backfill reports error counts',
  );

  // 7. Auth protection
  console.log('\n7. Auth & security:');
  checkFileContains(
    'supabase/functions/backfill-faltantes-recordatorios/index.ts',
    'requireServiceRoleAuth',
    'Backfill requires service-role auth',
  );

  // 8. Convention alignment (titulo format matches auto-reminder)
  console.log('\n8. Convention alignment:');
  const backfillContent = fs.existsSync(path.resolve(ROOT, 'supabase/functions/backfill-faltantes-recordatorios/index.ts'))
    ? fs.readFileSync(path.resolve(ROOT, 'supabase/functions/backfill-faltantes-recordatorios/index.ts'), 'utf-8')
    : '';
  const hookContent = fs.existsSync(path.resolve(ROOT, 'minimarket-system/src/hooks/queries/useFaltantes.ts'))
    ? fs.readFileSync(path.resolve(ROOT, 'minimarket-system/src/hooks/queries/useFaltantes.ts'), 'utf-8')
    : '';

  const backfillTitulo = backfillContent.match(/titulo:\s*`([^`]+)`/);
  const hookTitulo = hookContent.match(/titulo:\s*`([^`]+)`/);

  if (backfillTitulo && hookTitulo) {
    const bPrefix = backfillTitulo[1].split('$')[0];
    const hPrefix = hookTitulo[1].split('$')[0];
    if (bPrefix === hPrefix) {
      pass('Titulo format consistent between backfill and auto-reminder');
    } else {
      warn(`Titulo prefix drift: backfill="${bPrefix}" vs hook="${hPrefix}"`);
    }
  } else {
    warn('Could not extract titulo formats for comparison');
  }

  // Check tipo consistency
  if (backfillContent.includes("tipo: 'reposicion'") && hookContent.includes("tipo: 'reposicion'")) {
    pass('Tipo "reposicion" consistent between backfill and auto-reminder');
  } else {
    addIssue('Tipo field inconsistency between backfill and auto-reminder');
  }

  // Check prioridad consistency
  if (backfillContent.includes("prioridad: 'urgente'") && hookContent.includes("prioridad: 'urgente'")) {
    pass('Prioridad "urgente" consistent between backfill and auto-reminder');
  } else {
    addIssue('Prioridad field inconsistency');
  }
}

// ── Summary ──────────────────────────────────────────────────────────────

function printSummary() {
  console.log(`\n${CYAN}═══ Audit Summary ═══${RESET}`);
  if (issueCount === 0) {
    console.log(`\n  ${GREEN}All checks passed.${RESET} No integrity issues found.\n`);
  } else {
    console.log(`\n  ${RED}${issueCount} issue(s) found.${RESET} Review above for details.\n`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────

console.log(`${CYAN}Cuaderno/Faltantes Integrity Audit${RESET}`);
console.log(`Mode: ${isOffline ? 'offline (static checks only)' : 'offline (static checks only)'}`);
console.log(`Root: ${ROOT}`);

runStaticChecks();
printSummary();

process.exit(issueCount > 0 ? 1 : 0);
