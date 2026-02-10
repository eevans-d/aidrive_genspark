#!/usr/bin/env node
/**
 * Validate that local markdown links point to existing files/dirs.
 *
 * Scope (by default):
 * - README.md
 * - docs (excluding docs/closure)
 * - supabase
 *
 * Notes:
 * - External links (http/https/mailto/...) are ignored.
 * - Anchors (#...) are ignored after resolving the path.
 */

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const EXCLUDED_DIRS = new Set([
  '.git',
  '.worktrees',
  'node_modules',
  'coverage',
  'dist',
  'build',
  'test-reports',
]);

function exists(p) {
  try {
    fs.accessSync(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isExcludedDir(absPath) {
  const rel = path.relative(repoRoot, absPath);
  if (!rel || rel.startsWith('..')) return true;

  const parts = rel.split(path.sep);
  if (parts.includes('node_modules')) return true;
  if (parts[0] === 'docs' && parts[1] === 'closure') return true;
  return EXCLUDED_DIRS.has(parts[0]);
}

function walk(absDir, files = []) {
  if (isExcludedDir(absDir)) return files;
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const e of entries) {
    const abs = path.join(absDir, e.name);
    if (e.isDirectory()) {
      if (EXCLUDED_DIRS.has(e.name)) continue;
      walk(abs, files);
      continue;
    }
    if (e.isFile() && e.name.toLowerCase().endsWith('.md')) {
      files.push(abs);
    }
  }
  return files;
}

function extractLinkTargets(markdown) {
  const targets = [];

  // Inline links and images: [text](target) / ![alt](target)
  const inline = /\[[^\]]*\]\(([^)]+)\)/g;
  for (const m of markdown.matchAll(inline)) {
    targets.push(m[1]);
  }

  // Reference definitions: [id]: target
  const refDef = /^\[[^\]]+\]:\s*<?([^>\s]+)>?/gm;
  for (const m of markdown.matchAll(refDef)) {
    targets.push(m[1]);
  }

  return targets;
}

function normalizeTarget(raw) {
  const trimmed = raw.trim();

  // Strip optional title: (path "title")
  const firstToken = trimmed.split(/\s+/)[0] || '';

  // Strip <...>
  const token = firstToken.startsWith('<') && firstToken.endsWith('>')
    ? firstToken.slice(1, -1)
    : firstToken;

  // Remove anchor
  const [withoutAnchor] = token.split('#');
  return withoutAnchor;
}

function isExternalLink(target) {
  if (!target) return true;
  if (target.startsWith('#')) return true;
  return /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target); // scheme:
}

function resolveTarget(absMdFile, target) {
  if (target.startsWith('/')) {
    return path.resolve(repoRoot, target.slice(1));
  }
  return path.resolve(path.dirname(absMdFile), target);
}

const roots = [
  path.join(repoRoot, 'README.md'),
  path.join(repoRoot, 'docs'),
  path.join(repoRoot, 'supabase'),
];

const mdFiles = [];
for (const r of roots) {
  if (!exists(r)) continue;
  const st = fs.statSync(r);
  if (st.isFile() && r.toLowerCase().endsWith('.md')) {
    mdFiles.push(r);
    continue;
  }
  if (st.isDirectory()) {
    walk(r, mdFiles);
  }
}

const errors = [];

for (const absMd of mdFiles) {
  if (isExcludedDir(absMd)) continue;
  const markdown = fs.readFileSync(absMd, 'utf8');
  const targets = extractLinkTargets(markdown);
  for (const rawTarget of targets) {
    const norm = normalizeTarget(rawTarget);
    if (isExternalLink(norm)) continue;

    const resolved = resolveTarget(absMd, norm);
    const relResolved = path.relative(repoRoot, resolved);

    // Ignore links that resolve outside the repo.
    if (relResolved.startsWith('..')) continue;

    if (!exists(resolved)) {
      errors.push({
        file: path.relative(repoRoot, absMd),
        target: norm,
        resolved: relResolved,
      });
    }
  }
}

if (errors.length > 0) {
  console.error(`Broken doc links found: ${errors.length}`);
  for (const e of errors) {
    console.error(`- ${e.file}: (${e.target}) -> ${e.resolved}`);
  }
  process.exit(1);
}

console.log(`Doc link check OK (${mdFiles.length} files).`);
