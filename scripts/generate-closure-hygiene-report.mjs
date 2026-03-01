#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const closureDir = path.join(repoRoot, 'docs', 'closure');
const archiveHistoricalDir = path.join(closureDir, 'archive', 'historical');

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

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function isDeprecatedCandidate(fileName) {
  if (fileName === 'CONTEXT_PROMPT_CLAUDE_CODE_OCR_NUEVOS_2026-02-28.md') return true;
  if (fileName === 'PROMPT_CLAUDE_CODE_GO_INCONDICIONAL_2026-02-27.md') return true;
  return false;
}

function toDocPath(fileName) {
  return `docs/closure/${fileName}`;
}

async function main() {
  const entries = await fs.readdir(closureDir);
  const rootMarkdownFiles = entries
    .filter(isMarkdown)
    .filter((f) => !f.startsWith(HYGIENE_REPORT_PREFIX))
    .sort();

  let archivedHistoricalFiles = [];
  try {
    const archivedEntries = await fs.readdir(archiveHistoricalDir);
    archivedHistoricalFiles = archivedEntries.filter(isMarkdown).sort();
  } catch {
    archivedHistoricalFiles = [];
  }

  const active = new Set(STATIC_ACTIVE);
  const autogenLatest = [];
  for (const prefix of AUTOGEN_PREFIXES) {
    const latest = latestByPrefix(rootMarkdownFiles, prefix);
    if (latest) {
      active.add(latest);
      autogenLatest.push(latest);
    }
  }

  const deprecated = rootMarkdownFiles.filter((f) => isDeprecatedCandidate(f));
  const activeFiles = rootMarkdownFiles.filter((f) => active.has(f));
  const historicalInRoot = rootMarkdownFiles.filter(
    (f) => !active.has(f) && !deprecated.includes(f),
  );
  const historical = [
    ...archivedHistoricalFiles.map((f) => `archive/historical/${f}`),
    ...historicalInRoot,
  ];

  const reportFile = `CLOSURE_HYGIENE_REPORT_${todayUtc()}.md`;
  const reportPath = path.join(closureDir, reportFile);

  const content = `# Closure Hygiene Report
**Fecha:** ${todayUtc()} (UTC)
**Objetivo:** clasificar documentos de \`docs/closure\` en activos, historicos y deprecados para continuidad limpia.

## Resumen
- Total documentos Markdown en root: ${rootMarkdownFiles.length}
- Total historicos archivados: ${archivedHistoricalFiles.length}
- Activos: ${activeFiles.length}
- Historicos: ${historical.length}
- Deprecados: ${deprecated.length}

## Activos (usar para continuidad)
${activeFiles.map((f) => `- \`${toDocPath(f)}\``).join('\n')}

## Ultimos autogenerados detectados
${autogenLatest.length > 0 ? autogenLatest.map((f) => `- \`${toDocPath(f)}\``).join('\n') : '- `N/A`'}

## Deprecados
${deprecated.length > 0 ? deprecated.map((f) => `- \`${toDocPath(f)}\``).join('\n') : '- `N/A`'}

## Historicos (trazabilidad)
${historical.length > 0 ? historical.map((f) => `- \`${toDocPath(f)}\``).join('\n') : '- `N/A`'}

## Regla de uso
1. Para continuidad operativa usar solo secciones \"Activos\" y \"Ultimos autogenerados\".
2. No borrar historicos; conservar trazabilidad y enlazar desde README canonico.
3. Marcar deprecados en cabecera con fecha y reemplazo canonico.
`;

  await fs.writeFile(reportPath, content, 'utf8');
  console.log(`Generated ${path.relative(repoRoot, reportPath)}`);
}

main().catch((error) => {
  console.error('Failed to generate closure hygiene report');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
