#!/usr/bin/env node

/**
 * CI Guard: Validates alignment for critical dependencies.
 *
 * Scope:
 * 1) Strict cross-context alignment for @supabase/supabase-js across:
 *    - root package.json
 *    - minimarket-system/package.json
 *    - supabase/functions/deno.json
 *    - supabase/functions/import_map.json
 * 2) Major-version parity (root/frontend) for selected test/runtime tooling.
 *
 * Exits with code 1 on any blocking drift.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function readJSON(relPath) {
  const abs = resolve(ROOT, relPath);
  return JSON.parse(readFileSync(abs, 'utf8'));
}

function extractSemver(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/^[~^]/, '');
  const urlMatch = cleaned.match(/@(\d+\.\d+\.\d+)/);
  if (urlMatch) return urlMatch[1];
  const semverMatch = cleaned.match(/^(\d+\.\d+\.\d+)/);
  if (semverMatch) return semverMatch[1];
  return null;
}

function major(version) {
  if (!version) return null;
  return version.split('.')[0] || null;
}

function isPinned(raw) {
  if (!raw) return false;
  return !/^[~^]/.test(String(raw));
}

function readPackageDep(pkg, dep) {
  return pkg.dependencies?.[dep] || pkg.devDependencies?.[dep] || null;
}

const rootPkg = readJSON('package.json');
const frontendPkg = readJSON('minimarket-system/package.json');
const denoJson = readJSON('supabase/functions/deno.json');
const importMap = readJSON('supabase/functions/import_map.json');

let hasFailure = false;

function fail(message) {
  hasFailure = true;
  console.error(message);
}

console.log('\n=== Critical Dependency Governance Check ===\n');

// ---------------------------------------------------------------------------
// 1) Strict alignment: @supabase/supabase-js
// ---------------------------------------------------------------------------
const supabaseDep = '@supabase/supabase-js';

const supabaseSources = [
  {
    label: 'root/package.json',
    raw: readPackageDep(rootPkg, supabaseDep),
    pinnedRequired: true,
  },
  {
    label: 'minimarket-system/package.json',
    raw: readPackageDep(frontendPkg, supabaseDep),
    pinnedRequired: true,
  },
  {
    label: 'supabase/functions/deno.json',
    raw: denoJson.imports?.[supabaseDep] || null,
    pinnedRequired: false,
  },
  {
    label: 'supabase/functions/import_map.json',
    raw: importMap.imports?.[supabaseDep] || null,
    pinnedRequired: false,
  },
].map((src) => ({ ...src, version: extractSemver(src.raw) }));

console.log('1) Strict cross-context alignment');
console.log('Dependency: @supabase/supabase-js');
console.log('Source'.padEnd(42) + 'Raw'.padEnd(48) + 'Resolved'.padEnd(12) + 'Status');
console.log('-'.repeat(112));

const supabaseRef = supabaseSources.find((s) => s.version)?.version || null;

for (const src of supabaseSources) {
  const missing = !src.raw || !src.version;
  const drift = !missing && supabaseRef && src.version !== supabaseRef;
  const pinFail = src.pinnedRequired && !isPinned(src.raw);
  const status = missing ? 'MISSING' : drift ? 'DRIFT' : pinFail ? 'UNPINNED' : 'OK';

  if (status !== 'OK') {
    fail(`FAIL: ${supabaseDep} ${status} at ${src.label}`);
  }

  console.log(
    `${src.label.padEnd(42)}${String(src.raw || 'N/A').padEnd(48)}${String(
      src.version || 'N/A'
    ).padEnd(12)}${status}`
  );
}

if (!supabaseRef) {
  fail(`FAIL: could not determine a reference version for ${supabaseDep}`);
}

console.log('');

// ---------------------------------------------------------------------------
// 2) Major parity: root <-> frontend for critical shared tooling
// ---------------------------------------------------------------------------
const majorParityDeps = ['vitest', 'msw', '@testing-library/react', 'jsdom'];

console.log('2) Major parity for shared tooling (root/frontend)');
console.log('Dependency'.padEnd(28) + 'Root'.padEnd(18) + 'Frontend'.padEnd(18) + 'Status');
console.log('-'.repeat(82));

for (const dep of majorParityDeps) {
  const rootRaw = readPackageDep(rootPkg, dep);
  const frontendRaw = readPackageDep(frontendPkg, dep);
  const rootSemver = extractSemver(rootRaw);
  const frontendSemver = extractSemver(frontendRaw);

  let status = 'OK';

  if (!rootSemver || !frontendSemver) {
    // Non-blocking when a dependency is intentionally not shared.
    status = 'N/A';
  } else if (major(rootSemver) !== major(frontendSemver)) {
    status = 'MAJOR_DRIFT';
    fail(`FAIL: ${dep} major drift root=${rootSemver} frontend=${frontendSemver}`);
  }

  console.log(
    `${dep.padEnd(28)}${String(rootSemver || 'N/A').padEnd(18)}${String(
      frontendSemver || 'N/A'
    ).padEnd(18)}${status}`
  );
}

console.log('');

if (hasFailure) {
  console.error('FAIL: critical dependency governance check failed.');
  console.error('Remediation: align versions and pin strict dependencies where required.');
  process.exit(1);
}

console.log('PASS: critical dependency governance check passed.\n');
