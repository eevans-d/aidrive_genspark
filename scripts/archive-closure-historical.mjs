#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const closureDir = path.join(repoRoot, 'docs', 'closure');
const archiveDir = path.join(closureDir, 'archive', 'historical');

const AUTOGEN_PREFIXES = [
  'BASELINE_LOG_',
  'TECHNICAL_ANALYSIS_',
  'INVENTORY_REPORT_',
  'DOCUGUARD_REPORT_',
];

const HYGIENE_REPORT_PREFIX = 'CLOSURE_HYGIENE_REPORT_';
const STATIC_ACTIVE = new Set([
  'README_CANONICO.md',
  'OPEN_ISSUES.md',
  'LATEST_AUTOGEN_REPORTS.md',
  'CONTEXT_PROMPT_CLAUDE_CODE_OCR_NUEVOS_2026-03-01.md',
  'CONTEXT_PROMPT_ENGINEERING_CODEX_SISTEMA_INTEGRAL_CIERRE_2026-02-24.md',
  'PERF_BASELINE_2026-02-26_081540.md',
]);

function isMarkdown(fileName) {
  return fileName.endsWith('.md');
}

function latestByPrefix(files, prefix) {
  const candidates = files.filter((f) => f.startsWith(prefix)).sort();
  return candidates.length > 0 ? candidates[candidates.length - 1] : null;
}

function isDeprecatedCandidate(fileName) {
  if (fileName === 'CONTEXT_PROMPT_CLAUDE_CODE_OCR_NUEVOS_2026-02-28.md') return true;
  if (fileName === 'PROMPT_CLAUDE_CODE_GO_INCONDICIONAL_2026-02-27.md') return true;
  return false;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function listMarkdownFiles(dirPath) {
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listMarkdownFiles(fullPath));
      continue;
    }
    if (entry.isFile() && fullPath.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function main() {
  const entries = await fs.readdir(closureDir);
  const rootMarkdownFiles = entries
    .filter(isMarkdown)
    .filter((f) => !f.startsWith(HYGIENE_REPORT_PREFIX))
    .sort();

  const active = new Set(STATIC_ACTIVE);
  for (const prefix of AUTOGEN_PREFIXES) {
    const latest = latestByPrefix(rootMarkdownFiles, prefix);
    if (latest) {
      active.add(latest);
    }
  }

  const deprecated = new Set(rootMarkdownFiles.filter((f) => isDeprecatedCandidate(f)));
  const historical = rootMarkdownFiles.filter(
    (f) => !active.has(f) && !deprecated.has(f),
  );

  if (historical.length === 0) {
    console.log('No historical closure docs to archive.');
    return;
  }

  await fs.mkdir(archiveDir, { recursive: true });

  for (const fileName of historical) {
    const src = path.join(closureDir, fileName);
    const dest = path.join(archiveDir, fileName);
    await fs.rename(src, dest);
  }

  const markdownFiles = [
    ...(await listMarkdownFiles(path.join(repoRoot, 'docs'))),
    ...(await listMarkdownFiles(path.join(repoRoot, '.agent'))),
    ...(await listMarkdownFiles(path.join(repoRoot, '.github'))),
    path.join(repoRoot, 'README.md'),
    path.join(repoRoot, 'AGENTS.md'),
    path.join(repoRoot, 'CLAUDE.md'),
  ];

  let modifiedFiles = 0;
  for (const filePath of markdownFiles) {
    let content;
    try {
      content = await fs.readFile(filePath, 'utf8');
    } catch {
      continue;
    }

    let updated = content;
    for (const fileName of historical) {
      const oldPath = `docs/closure/${fileName}`;
      const newPath = `docs/closure/archive/historical/${fileName}`;
      const regex = new RegExp(escapeRegExp(oldPath), 'g');
      updated = updated.replace(regex, newPath);
    }

    if (updated !== content) {
      await fs.writeFile(filePath, updated, 'utf8');
      modifiedFiles += 1;
    }
  }

  console.log(`Archived ${historical.length} files to docs/closure/archive/historical`);
  console.log(`Rewritten references in ${modifiedFiles} markdown files`);
}

main().catch((error) => {
  console.error('Failed to archive historical closure docs');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
