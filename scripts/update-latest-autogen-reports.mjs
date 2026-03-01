#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const closureDir = path.join(repoRoot, 'docs', 'closure');
const archiveHistoricalDir = path.join(closureDir, 'archive', 'historical');
const outputPath = path.join(closureDir, 'LATEST_AUTOGEN_REPORTS.md');

const REPORT_PREFIXES = [
  { key: 'BASELINE_LOG', label: 'Baseline' },
  { key: 'TECHNICAL_ANALYSIS', label: 'Technical analysis' },
  { key: 'INVENTORY_REPORT', label: 'Inventory report' },
  { key: 'DOCUGUARD_REPORT', label: 'DocuGuard' },
];

function isMarkdown(fileName) {
  return fileName.endsWith('.md');
}

function extractDateToken(fileName) {
  const match = fileName.match(/_(\d{4}-\d{2}-\d{2})_/);
  return match ? match[1] : null;
}

function locationRank(location) {
  return location === 'root' ? 1 : 0;
}

function compareFileRef(a, b) {
  const byName = a.name.localeCompare(b.name);
  if (byName !== 0) return byName;
  return locationRank(a.location) - locationRank(b.location);
}

function latestByLexicographic(items) {
  if (items.length === 0) return null;
  return [...items].sort(compareFileRef).at(-1) ?? null;
}

function newestGroup(items) {
  const latest = latestByLexicographic(items);
  if (!latest) return { latest: null, sameDayHistory: [] };
  const latestDay = extractDateToken(latest.name);
  const sameDay = latestDay
    ? items
      .filter((f) => extractDateToken(f.name) === latestDay)
      .sort(compareFileRef)
    : [];
  const sameDayHistory = sameDay.filter((f) => f.name !== latest.name || f.location !== latest.location);
  return { latest, sameDayHistory };
}

function toDocPath(file) {
  if (file.location === 'archive') {
    return `docs/closure/archive/historical/${file.name}`;
  }
  return `docs/closure/${file.name}`;
}

function renderMarkdown(groups) {
  const today = new Date().toISOString().slice(0, 10);
  const activeLines = [];
  const historyLines = [];

  for (const { label, latest, sameDayHistory } of groups) {
    activeLines.push(`- ${label}:`);
    if (latest) {
      activeLines.push(`  - \`${toDocPath(latest)}\``);
    } else {
      activeLines.push('  - `N/A`');
    }

    for (const historical of sameDayHistory) {
      historyLines.push(`- \`${toDocPath(historical)}\``);
    }
  }

  const historicalBlock = historyLines.length > 0
    ? historyLines.join('\n')
    : '- `N/A`';

  return `# Latest Autogen Reports

**Ultima actualizacion:** ${today}
**Objetivo:** reducir ruido operativo en \`docs/closure/\` dejando una referencia unica a los artefactos autogenerados mas recientes.

## Referencia activa (ultima corrida conocida)

${activeLines.join('\n')}

## Referencias historicas inmediatas (mismo dia)

${historicalBlock}

## Regla operativa

1. Para continuidad de trabajo usar siempre la seccion "Referencia activa".
2. Conservar historicos para trazabilidad, sin tomarlos como estado principal.
3. Si se genera una corrida nueva, ejecutar \`node scripts/update-latest-autogen-reports.mjs\` y commitear el cambio.
`;
}

async function main() {
  const entries = await fs.readdir(closureDir);
  const rootFiles = entries
    .filter(isMarkdown)
    .map((name) => ({ name, location: 'root' }));

  let archiveFiles = [];
  try {
    const archivedEntries = await fs.readdir(archiveHistoricalDir);
    archiveFiles = archivedEntries
      .filter(isMarkdown)
      .map((name) => ({ name, location: 'archive' }));
  } catch {
    archiveFiles = [];
  }

  const groups = REPORT_PREFIXES.map(({ key, label }) => {
    const files = [...rootFiles, ...archiveFiles].filter((f) => f.name.startsWith(`${key}_`));
    const { latest, sameDayHistory } = newestGroup(files);
    return { key, label, latest, sameDayHistory };
  });

  const markdown = renderMarkdown(groups);
  await fs.writeFile(outputPath, markdown, 'utf8');
  console.log(`Updated ${path.relative(repoRoot, outputPath)}`);
}

main().catch((err) => {
  console.error('Failed to update latest autogen reports index');
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
