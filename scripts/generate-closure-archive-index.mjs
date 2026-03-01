#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const archiveDir = path.join(repoRoot, 'docs', 'closure', 'archive', 'historical');
const outputPath = path.join(repoRoot, 'docs', 'closure', 'archive', 'INDEX.md');

const PREFIX_GROUPS = [
  'AUDIT_',
  'BASELINE_LOG_',
  'TECHNICAL_ANALYSIS_',
  'INVENTORY_REPORT_',
  'DOCUGUARD_REPORT_',
  'OCR_NUEVOS_',
  'FINAL_REPORT_',
  'INFORME_',
];

function isMarkdown(fileName) {
  return fileName.endsWith('.md');
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10);
}

function groupName(fileName) {
  for (const prefix of PREFIX_GROUPS) {
    if (fileName.startsWith(prefix)) return prefix;
  }
  return 'OTROS';
}

async function main() {
  let files = [];
  try {
    files = (await fs.readdir(archiveDir)).filter(isMarkdown).sort();
  } catch {
    files = [];
  }

  const grouped = new Map();
  for (const file of files) {
    const key = groupName(file);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(file);
  }

  const groupOrder = [...PREFIX_GROUPS, 'OTROS'].filter((g) => grouped.has(g));

  const sections = groupOrder
    .map((group) => {
      const items = grouped.get(group);
      return [
        `### ${group}`,
        ...items.map((file) => `- \`docs/closure/archive/historical/${file}\``),
      ].join('\n');
    })
    .join('\n\n');

  const content = `# Closure Archive Index
**Ultima actualizacion:** ${todayUtc()}
**Objetivo:** indice operativo de historicos archivados en \`docs/closure/archive/historical\`.

## Resumen
- Total historicos archivados: ${files.length}

## Grupos
${sections || '- `N/A`'}

## Regla operativa
1. No usar estos documentos como fuente primaria.
2. La continuidad activa vive en \`docs/closure/README_CANONICO.md\`.
3. Regenerar este indice con \`node scripts/generate-closure-archive-index.mjs\`.
`;

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, content, 'utf8');
  console.log(`Updated ${path.relative(repoRoot, outputPath)}`);
}

main().catch((error) => {
  console.error('Failed to generate closure archive index');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
