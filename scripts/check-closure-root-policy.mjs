#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const closureDir = path.join(repoRoot, 'docs', 'closure');

const AUTOGEN_PREFIXES = [
  'BASELINE_LOG_',
  'TECHNICAL_ANALYSIS_',
  'INVENTORY_REPORT_',
  'DOCUGUARD_REPORT_',
];

const STATIC_ACTIVE = new Set([
  'README_CANONICO.md',
  'OPEN_ISSUES.md',
  'LATEST_AUTOGEN_REPORTS.md',
  'CONTEXT_PROMPT_CLAUDE_CODE_OCR_NUEVOS_2026-03-01.md',
  'CONTEXT_PROMPT_ENGINEERING_CODEX_SISTEMA_INTEGRAL_CIERRE_2026-02-24.md',
  'PERF_BASELINE_2026-02-26_081540.md',
]);

const DEPRECATED_ALLOWED = new Set([
  'CONTEXT_PROMPT_CLAUDE_CODE_OCR_NUEVOS_2026-02-28.md',
  'PROMPT_CLAUDE_CODE_GO_INCONDICIONAL_2026-02-27.md',
]);

const HYGIENE_PREFIX = 'CLOSURE_HYGIENE_REPORT_';

function latestByPrefix(files, prefix) {
  const candidates = files.filter((f) => f.startsWith(prefix)).sort();
  return candidates.length > 0 ? candidates[candidates.length - 1] : null;
}

async function main() {
  const entries = await fs.readdir(closureDir);
  const rootMarkdown = entries.filter((f) => f.endsWith('.md')).sort();

  const allowed = new Set(STATIC_ACTIVE);
  for (const prefix of AUTOGEN_PREFIXES) {
    const latest = latestByPrefix(rootMarkdown, prefix);
    if (latest) allowed.add(latest);
  }
  for (const deprecated of DEPRECATED_ALLOWED) {
    allowed.add(deprecated);
  }

  const unexpected = rootMarkdown.filter(
    (f) => !allowed.has(f) && !f.startsWith(HYGIENE_PREFIX),
  );

  if (unexpected.length > 0) {
    console.error('Closure root policy failed. Unexpected files in docs/closure root:');
    for (const fileName of unexpected) {
      console.error(`- docs/closure/${fileName}`);
    }
    process.exit(1);
  }

  console.log('Closure root policy OK.');
}

main().catch((error) => {
  console.error('Failed to evaluate closure root policy');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
