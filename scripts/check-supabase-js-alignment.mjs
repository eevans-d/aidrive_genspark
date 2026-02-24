#!/usr/bin/env node

/**
 * CI Guard: Validates that @supabase/supabase-js version is aligned
 * across root, frontend, deno.json, and import_map.json.
 *
 * Exits with code 1 if versions are misaligned.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const PKG = '@supabase/supabase-js';

function readJSON(relPath) {
  const abs = resolve(ROOT, relPath);
  return JSON.parse(readFileSync(abs, 'utf8'));
}

function extractSemver(raw) {
  if (!raw) return null;
  // Strip caret/tilde prefixes
  let v = raw.replace(/^[~^]/, '');
  // Extract version from esm.sh URL like https://esm.sh/@supabase/supabase-js@2.95.3
  const urlMatch = v.match(/@(\d+\.\d+\.\d+)/);
  if (urlMatch) return urlMatch[1];
  // Already semver
  const semverMatch = v.match(/^(\d+\.\d+\.\d+)/);
  if (semverMatch) return semverMatch[1];
  return null;
}

const sources = [
  {
    label: 'root/package.json (devDependencies)',
    path: 'package.json',
    extract: (json) => json.devDependencies?.[PKG] || json.dependencies?.[PKG],
  },
  {
    label: 'minimarket-system/package.json (dependencies)',
    path: 'minimarket-system/package.json',
    extract: (json) => json.dependencies?.[PKG] || json.devDependencies?.[PKG],
  },
  {
    label: 'supabase/functions/deno.json (imports)',
    path: 'supabase/functions/deno.json',
    extract: (json) => json.imports?.[PKG],
  },
  {
    label: 'supabase/functions/import_map.json (imports)',
    path: 'supabase/functions/import_map.json',
    extract: (json) => json.imports?.[PKG],
  },
];

let allOk = true;
const results = [];

for (const src of sources) {
  try {
    const json = readJSON(src.path);
    const raw = src.extract(json);
    const version = extractSemver(raw);
    results.push({ label: src.label, raw, version });
  } catch (err) {
    results.push({ label: src.label, raw: null, version: null, error: err.message });
  }
}

// Determine reference version (first non-null)
const refVersion = results.find((r) => r.version)?.version;

if (!refVersion) {
  console.error(`ERROR: Could not find ${PKG} in any source.`);
  process.exit(1);
}

console.log(`\n=== ${PKG} Alignment Check ===\n`);
console.log(`Reference version: ${refVersion}\n`);
console.log('Source'.padEnd(52) + 'Raw'.padEnd(52) + 'Resolved'.padEnd(12) + 'Status');
console.log('-'.repeat(120));

for (const r of results) {
  const status = r.error ? 'ERROR' : r.version === refVersion ? 'OK' : 'DRIFT';
  const icon = status === 'OK' ? 'OK' : 'FAIL';
  if (status !== 'OK') allOk = false;
  console.log(
    `${r.label.padEnd(52)}${(r.raw || r.error || 'N/A').padEnd(52)}${(r.version || 'N/A').padEnd(12)}${icon}`
  );
}

console.log('');

if (!allOk) {
  console.error(`FAIL: ${PKG} version drift detected.`);
  console.error(`Action: align all sources to ${refVersion} and commit.\n`);
  console.error('Files to check:');
  console.error('  - package.json');
  console.error('  - minimarket-system/package.json');
  console.error('  - supabase/functions/deno.json');
  console.error('  - supabase/functions/import_map.json');
  process.exit(1);
} else {
  console.log(`PASS: All sources aligned at ${refVersion}.\n`);
}
