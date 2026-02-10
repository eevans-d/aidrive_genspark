import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const ignoreDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.next',
  'out',
  'tmp',
  '.turbo',
]);

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoreDirs.has(entry.name)) continue;
      files.push(...walkDir(path.join(dir, entry.name)));
    } else if (entry.isFile()) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function countApiMinimarketEndpoints() {
  const filePath = path.join(repoRoot, 'supabase/functions/api-minimarket/index.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  const matches = content.match(/path\s*===\s*['"`][^'"`]+['"`]\s*&&\s*method\s*===\s*['"`][^'"`]+['"`]/g);
  return matches ? matches.length : 0;
}

function countApiProveedorEndpoints() {
  const filePath = path.join(repoRoot, 'supabase/functions/api-proveedor/schemas.ts');
  const content = fs.readFileSync(filePath, 'utf8');
  const listMatch = content.match(/export const endpointList: EndpointName\[] = \[([\s\S]*?)\]/);
  if (!listMatch) return 0;
  const items = listMatch[1].match(/'[^']+'/g);
  return items ? items.length : 0;
}

function countHooks() {
  const hooksDir = path.join(repoRoot, 'minimarket-system/src/hooks/queries');
  const files = walkDir(hooksDir);
  return files.filter((file) => {
    const base = path.basename(file);
    if (!base.startsWith('use')) return false;
    if (!/\.(ts|tsx)$/.test(base)) return false;
    if (base.includes('.test.')) return false;
    if (base === 'index.ts') return false;
    return true;
  }).length;
}

function countPages() {
  const pagesDir = path.join(repoRoot, 'minimarket-system/src/pages');
  const files = walkDir(pagesDir);
  return files.filter((file) => {
    const base = path.basename(file);
    if (!base.endsWith('.tsx')) return false;
    if (base.includes('.test.')) return false;
    return true;
  }).length;
}

function getTestFilesByFolder() {
  const files = walkDir(repoRoot);
  const testRegex = /\.(test|spec)\.[jt]sx?$/;
  const counts = new Map();

  for (const file of files) {
    if (!testRegex.test(file)) continue;
    const relativeDir = path.relative(repoRoot, path.dirname(file)) || '.';
    counts.set(relativeDir, (counts.get(relativeDir) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([folder, count]) => ({ folder, count }));
}

function renderMetrics() {
  const apiMinimarketEndpoints = countApiMinimarketEndpoints();
  const apiProveedorEndpoints = countApiProveedorEndpoints();
  const totalEndpoints = apiMinimarketEndpoints + apiProveedorEndpoints;
  const hooks = countHooks();
  const pages = countPages();
  const testFilesByFolder = getTestFilesByFolder();
  const totalTestFiles = testFilesByFolder.reduce((sum, entry) => sum + entry.count, 0);
  const generatedAt = new Date().toISOString();

  const testRows = testFilesByFolder
    .map((entry) => `| ${entry.folder} | ${entry.count} |`)
    .join('\n');

  return `# Métricas de Código (Fuente única)\n\n` +
    `**Generado:** ${generatedAt} (UTC)\n` +
    `**Script:** \`scripts/metrics.mjs\`\n\n` +
    `## Definiciones\n\n` +
    `- **Endpoints:** rutas contadas en \`supabase/functions/api-minimarket/index.ts\` (\"path === ... && method === ...\") + lista \`endpointList\` en \`supabase/functions/api-proveedor/schemas.ts\`.\n` +
    `- **Hooks:** archivos \`use*.ts/tsx\` en \`minimarket-system/src/hooks/queries\`, excluye \`index.ts\` y tests.\n` +
    `- **Páginas:** archivos \`.tsx\` en \`minimarket-system/src/pages\`, excluye tests.\n` +
    `- **Tests:** archivos con sufijo \`.test.*\` o \`.spec.*\` en todo el repo, agrupados por carpeta.\n\n` +
    `## Resumen\n\n` +
    `| Métrica | Total | Detalle |\n` +
    `|---|---:|---|\n` +
    `| Endpoints | ${totalEndpoints} | api-minimarket: ${apiMinimarketEndpoints}, api-proveedor: ${apiProveedorEndpoints} |\n` +
    `| Hooks (React Query) | ${hooks} | \`minimarket-system/src/hooks/queries\` |\n` +
    `| Páginas | ${pages} | \`minimarket-system/src/pages\` |\n` +
    `| Test files | ${totalTestFiles} | total en repo |\n\n` +
    `## Test files por carpeta\n\n` +
    `| Carpeta | Cantidad |\n` +
    `|---|---:|\n` +
    `${testRows}\n`;
}

function main() {
  const metricsPath = path.join(repoRoot, 'docs/METRICS.md');
  const content = renderMetrics();
  fs.writeFileSync(metricsPath, content);
  console.log(`Métricas generadas en ${path.relative(repoRoot, metricsPath)}`);
}

main();
