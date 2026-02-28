#!/usr/bin/env node
/**
 * ocr-procesar-nuevos.mjs — Batch OCR processing for new invoice images.
 *
 * Usage:
 *   node scripts/ocr-procesar-nuevos.mjs --dry-run     # Preview (default)
 *   node scripts/ocr-procesar-nuevos.mjs --execute --proveedor=<uuid>  # Upload + OCR
 *
 * Phases:
 *   1. List images in proveedores_facturas_temp/nuevos
 *   2. Detect duplicates by hash
 *   3. Upload canonical images to Supabase Storage bucket 'facturas'
 *   4. Create facturas_ingesta records
 *   5. Invoke facturas-ocr Edge Function for extraction
 *   6. Report results
 *
 * Env required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (from .env.test)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, dirname, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const IMAGES_DIR = resolve(ROOT, 'proveedores_facturas_temp/nuevos');
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.pdf'];
const CONTENT_TYPE_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.pdf': 'application/pdf',
};

// ──────────────────────────────────────
// Env loader
// ──────────────────────────────────────
function loadEnv() {
  const envPath = resolve(ROOT, '.env.test');
  try {
    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        process.env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
      }
    }
  } catch {
    console.error('ERROR: No se encontró .env.test');
    process.exit(1);
  }
}

// ──────────────────────────────────────
// Phase 1: Inventory
// ──────────────────────────────────────
function inventoryImages() {
  const files = readdirSync(IMAGES_DIR).sort();
  const images = [];
  const sidecars = [];
  const auxiliary = [];

  for (const f of files) {
    const fullPath = resolve(IMAGES_DIR, f);
    if (!statSync(fullPath).isFile()) continue;

    if (f.includes(':Zone.Identifier')) {
      sidecars.push(f);
      continue;
    }

    const ext = extname(f).toLowerCase();
    if (VALID_EXTENSIONS.includes(ext)) {
      const content = readFileSync(fullPath);
      const hash = createHash('md5').update(content).digest('hex');
      images.push({ filename: f, path: fullPath, ext, hash, size: content.length });
    } else {
      auxiliary.push(f);
    }
  }

  return { images, sidecars, auxiliary };
}

// ──────────────────────────────────────
// Phase 2: Dedup
// ──────────────────────────────────────
function detectDuplicates(images) {
  const hashMap = new Map();
  for (const img of images) {
    if (hashMap.has(img.hash)) {
      img.duplicateOf = hashMap.get(img.hash).filename;
      img.isCanonical = false;
    } else {
      hashMap.set(img.hash, img);
      img.duplicateOf = null;
      img.isCanonical = true;
    }
  }
  return images;
}

// ──────────────────────────────────────
// Phase 3: Fetch proveedores
// ──────────────────────────────────────
async function fetchProveedores(supabaseUrl, serviceRoleKey) {
  const res = await fetch(`${supabaseUrl}/rest/v1/proveedores?select=id,nombre,cuit&activo=eq.true`, {
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
    },
  });
  if (!res.ok) throw new Error(`Error fetching proveedores: ${res.status}`);
  return res.json();
}

// ──────────────────────────────────────
// Phase 4: Upload to Storage
// ──────────────────────────────────────
async function uploadImage(supabaseUrl, serviceRoleKey, proveedorId, filename, imageBuffer) {
  const timestamp = basename(filename, extname(filename));
  const ext = extname(filename);
  const storagePath = `${proveedorId}/${timestamp}${ext}`;
  const contentType = CONTENT_TYPE_BY_EXT[ext.toLowerCase()] || 'application/octet-stream';

  const res = await fetch(`${supabaseUrl}/storage/v1/object/facturas/${storagePath}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: imageBuffer,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upload failed for ${filename}: ${res.status} — ${err}`);
  }

  return storagePath;
}

// ──────────────────────────────────────
// Phase 5: Create facturas_ingesta record
// ──────────────────────────────────────
function buildBatchNumero(originalFilename) {
  return `BATCH-${originalFilename.replace(/\.[^.]+$/, '')}`;
}

async function findExistingFactura(supabaseUrl, serviceRoleKey, proveedorId, numero) {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/facturas_ingesta?proveedor_id=eq.${encodeURIComponent(proveedorId)}&numero=eq.${encodeURIComponent(numero)}&select=id,estado,numero,imagen_url&limit=1`,
    {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
    },
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

async function createFacturaRecord(supabaseUrl, serviceRoleKey, proveedorId, imagenUrl, originalFilename) {
  // Use original filename as temp numero to avoid UNIQUE constraint with NULL values
  const tempNumero = buildBatchNumero(originalFilename);
  const res = await fetch(`${supabaseUrl}/rest/v1/facturas_ingesta`, {
    method: 'POST',
    headers: {
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      proveedor_id: proveedorId,
      imagen_url: imagenUrl,
      numero: tempNumero,
      estado: 'pendiente',
      request_id: `batch_${Date.now()}_${originalFilename}`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create factura failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data[0] || data;
}

// ──────────────────────────────────────
// Phase 6: Invoke OCR extraction
// ──────────────────────────────────────
async function invokeOcr(supabaseUrl, serviceRoleKey, facturaId) {
  const res = await fetch(`${supabaseUrl}/functions/v1/facturas-ocr`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceRoleKey}`,
      'apikey': serviceRoleKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ factura_id: facturaId }),
  });

  const body = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    status: res.status,
    data: body,
  };
}

// ──────────────────────────────────────
// Main
// ──────────────────────────────────────
async function main() {
  const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';
  const proveedorArg = process.argv.find(a => a.startsWith('--proveedor='));
  const defaultProveedorId = proveedorArg ? proveedorArg.split('=')[1] : null;

  loadEnv();

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('ERROR: Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  OCR Batch Processor [${mode.toUpperCase()}]`);
  console.log(`  ${new Date().toISOString()}`);
  console.log(`${'='.repeat(60)}\n`);

  // --- Inventory ---
  console.log('📁 Fase 1: Inventario de imágenes...');
  const { images, sidecars, auxiliary } = inventoryImages();
  console.log(`  Imágenes válidas: ${images.length}`);
  console.log(`  Sidecars (Zone.Identifier): ${sidecars.length}`);
  console.log(`  Auxiliares: ${auxiliary.length} (${auxiliary.join(', ') || 'ninguno'})`);

  // --- Dedup ---
  console.log('\n🔍 Fase 2: Detección de duplicados...');
  const classified = detectDuplicates(images);
  const canonical = classified.filter(i => i.isCanonical);
  const duplicates = classified.filter(i => !i.isCanonical);
  console.log(`  Canónicas: ${canonical.length}`);
  console.log(`  Duplicadas: ${duplicates.length}`);
  for (const d of duplicates) {
    console.log(`    ${d.filename} → duplicado de ${d.duplicateOf}`);
  }

  // --- Proveedores ---
  console.log('\n👥 Fase 3: Consulta de proveedores...');
  const proveedores = await fetchProveedores(supabaseUrl, serviceRoleKey);
  console.log(`  Proveedores activos en BD: ${proveedores.length}`);

  if (proveedores.length === 0) {
    console.log('\n⚠️  BLOQUEADO: No hay proveedores en la base de datos.');
    console.log('  Primero ejecute: node scripts/seed-proveedores.mjs --execute');
    console.log('  Luego vuelva a ejecutar este script con --proveedor=<uuid>');

    if (mode === 'dry-run') {
      console.log('\n📋 Resumen de imágenes listas para procesamiento:');
      for (const img of canonical) {
        console.log(`  [READY] ${img.filename} (${(img.size / 1024 / 1024).toFixed(1)}MB) hash:${img.hash.slice(0, 8)}`);
      }
      console.log(`\nTotal: ${canonical.length} imágenes canónicas listas para OCR.`);
      console.log('Estado: BLOCKED — proveedores vacíos.\n');
    }
    return {
      processed: 0,
      blocked: canonical.length,
      reason: 'PROVEEDORES_EMPTY',
    };
  }

  // Show available proveedores
  for (const p of proveedores) {
    console.log(`  ${p.id} — ${p.nombre} ${p.cuit ? `(CUIT: ${p.cuit})` : ''}`);
  }

  if (!defaultProveedorId) {
    console.log('\n⚠️  No se especificó --proveedor=<uuid>.');
    console.log('  En modo execute el proveedor es obligatorio para evitar ingesta incorrecta.');
    console.log('  Use: node scripts/ocr-procesar-nuevos.mjs --execute --proveedor=<uuid>\n');
  }

  const targetProveedorId = defaultProveedorId || null;

  if (mode === 'execute' && !targetProveedorId) {
    console.error('ERROR: --proveedor=<uuid> es obligatorio en modo execute.');
    process.exit(1);
  }

  if (mode === 'dry-run') {
    console.log('\n📋 [DRY-RUN] Se procesarían:');
    for (const img of canonical) {
      const proveedorLabel = targetProveedorId || '<REQUERIDO_EN_EXECUTE>';
      console.log(`  [UPLOAD+OCR] ${img.filename} → proveedor: ${proveedorLabel}`);
    }
    console.log(`\nTotal: ${canonical.length} imágenes. Usar --execute para procesar.\n`);
    return { processed: 0, dryRun: canonical.length, proveedorRequired: !targetProveedorId };
  }

  // --- Execute ---
  console.log('\n🚀 Fase 4-6: Upload + Ingesta + OCR...\n');
  const results = [];

  for (const img of canonical) {
    const label = img.filename;
    try {
      const batchNumero = buildBatchNumero(img.filename);
      const existing = await findExistingFactura(supabaseUrl, serviceRoleKey, targetProveedorId, batchNumero);
      if (existing) {
        console.log(`  ↺ Reuse: ${label} → factura existente ${existing.id} (estado: ${existing.estado})`);
        const ocr = await invokeOcr(supabaseUrl, serviceRoleKey, existing.id);
        if (ocr.ok) {
          console.log(`  ✓ OCR(reprocess): ${label} → items: ${ocr.data?.items_count ?? '?'}, estado: ${ocr.data?.estado ?? '?'}`);
          results.push({
            filename: label,
            factura_id: existing.id,
            status: 'reprocess_ok',
            items_count: ocr.data?.items_count ?? 0,
            estado: ocr.data?.estado ?? 'unknown',
          });
        } else {
          console.log(`  ✗ OCR(reprocess) Error: ${label} → ${ocr.status} ${JSON.stringify(ocr.data).slice(0, 200)}`);
          results.push({
            filename: label,
            factura_id: existing.id,
            status: 'reprocess_error',
            error: `${ocr.status}: ${ocr.data?.error || 'unknown'}`,
          });
        }
        console.log('');
        continue;
      }

      // 4. Upload
      const imageBuffer = readFileSync(img.path);
      const storagePath = await uploadImage(supabaseUrl, serviceRoleKey, targetProveedorId, img.filename, imageBuffer);
      console.log(`  ✓ Upload: ${label} → ${storagePath}`);

      // 5. Create record
      const factura = await createFacturaRecord(supabaseUrl, serviceRoleKey, targetProveedorId, storagePath, img.filename);
      console.log(`  ✓ Factura: ${factura.id} (estado: ${factura.estado})`);

      // 6. OCR
      const ocr = await invokeOcr(supabaseUrl, serviceRoleKey, factura.id);
      if (ocr.ok) {
        console.log(`  ✓ OCR: ${label} → items: ${ocr.data?.items_count ?? '?'}, estado: ${ocr.data?.estado ?? '?'}`);
        results.push({
          filename: label,
          factura_id: factura.id,
          status: 'ok',
          items_count: ocr.data?.items_count ?? 0,
          estado: ocr.data?.estado ?? 'unknown',
        });
      } else {
        console.log(`  ✗ OCR Error: ${label} → ${ocr.status} ${JSON.stringify(ocr.data).slice(0, 200)}`);
        results.push({
          filename: label,
          factura_id: factura.id,
          status: 'ocr_error',
          error: `${ocr.status}: ${ocr.data?.error || 'unknown'}`,
        });
      }
    } catch (err) {
      console.log(`  ✗ Error: ${label} → ${err.message}`);
      results.push({
        filename: label,
        factura_id: null,
        status: 'error',
        error: err.message,
      });
    }
    console.log('');
  }

  // --- Summary ---
  const ok = results.filter(r => r.status === 'ok' || r.status === 'reprocess_ok').length;
  const errors = results.filter(r => r.status !== 'ok' && r.status !== 'reprocess_ok').length;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`  Resultados: ${ok} OK, ${errors} errores de ${canonical.length} canónicas`);
  console.log(`${'='.repeat(60)}\n`);

  return { processed: ok, errors, results };
}

main().then(result => {
  console.log(JSON.stringify(result, null, 2));
}).catch(err => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
