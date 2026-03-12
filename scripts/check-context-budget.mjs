#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const CONTEXT_EXCLUSIONS = [
  'node_modules/',
  'minimarket-system/node_modules/',
  'logs/',
  'test-reports/',
  'supabase/.temp/',
  'docs/closure/archive/historical/',
];

const DOC_BUDGETS = [
  { path: 'docs/CONTEXT0_EJECUTIVO.md', target: 1000, hardCap: 1200 },
  { path: 'docs/ESTADO_ACTUAL.md', target: 2000, hardCap: 14000 },
  { path: 'docs/DECISION_LOG.md', target: 2000, hardCap: 12000 },
  { path: 'docs/closure/OPEN_ISSUES.md', target: 2000, hardCap: 6000 },
  { path: 'docs/API_README.md', target: 2000, hardCap: 9000 },
  { path: 'docs/ESQUEMA_BASE_DATOS_ACTUAL.md', target: 2000, hardCap: 14000 },
  { path: 'docs/METRICS.md', target: 2000, hardCap: 4000 },
  { path: 'docs/PLAN_FUSIONADO_FACTURAS_OCR.md', target: 2000, hardCap: 5000 },
  { path: 'docs/PLAN_ASISTENTE_IA_DASHBOARD.md', target: 2000, hardCap: 5000 },
];

const strictMode = process.argv.includes('--strict');
const jsonMode = process.argv.includes('--json');

function countWords(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

function evaluateRule(rule) {
  const absPath = path.join(ROOT, rule.path);
  if (!fs.existsSync(absPath)) {
    return {
      ...rule,
      words: 0,
      status: 'MISSING',
      exists: false,
    };
  }

  const words = countWords(fs.readFileSync(absPath, 'utf8'));
  let status = 'OK';
  if (words > rule.hardCap) {
    status = 'FAIL_HARD_CAP';
  } else if (words > rule.target) {
    status = 'WARN_TARGET';
  }

  return {
    ...rule,
    words,
    status,
    exists: true,
  };
}

const results = DOC_BUDGETS.map(evaluateRule);
const totals = {
  docs: results.length,
  ok: results.filter((r) => r.status === 'OK').length,
  warn: results.filter((r) => r.status === 'WARN_TARGET').length,
  fail: results.filter((r) => r.status === 'FAIL_HARD_CAP' || r.status === 'MISSING').length,
};

if (jsonMode) {
  console.log(
    JSON.stringify(
      {
        strictMode,
        exclusions: CONTEXT_EXCLUSIONS,
        totals,
        results,
      },
      null,
      2,
    ),
  );
} else {
  console.log('# Context Budget Report');
  console.log('');
  console.log(`- Strict mode: ${strictMode ? 'enabled' : 'disabled'}`);
  console.log('- Default context exclusions:');
  for (const exclusion of CONTEXT_EXCLUSIONS) {
    console.log(`  - ${exclusion}`);
  }
  console.log('');
  console.log('| Doc | Words | Target | Hard Cap | Status |');
  console.log('|---|---:|---:|---:|---|');
  for (const row of results) {
    console.log(`| ${row.path} | ${row.words} | ${row.target} | ${row.hardCap} | ${row.status} |`);
  }
  console.log('');
  console.log(`Summary: ok=${totals.ok} warn=${totals.warn} fail=${totals.fail} total=${totals.docs}`);
}

const hasHardFailure = totals.fail > 0;
const hasStrictFailure = strictMode && totals.warn > 0;

if (hasHardFailure || hasStrictFailure) {
  process.exit(1);
}

process.exit(0);
