#!/usr/bin/env node
/**
 * seed-supplier-profiles.mjs
 * 
 * Carga los supplier profiles en la tabla `supplier_profiles` basándose en las
 * reglas de negocio documentadas en BRIEFING_AGENTE_MINIMARKET.md (sección 6).
 * 
 * Uso:
 *   node scripts/seed-supplier-profiles.mjs --dry-run   # (default) Solo muestra qué insertaría
 *   node scripts/seed-supplier-profiles.mjs --execute    # Inserta en producción
 * 
 * Requiere: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.test
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { error as logError } from './_shared/cli-log.mjs';

// --- Cargar .env.test ---
const envPath = resolve(process.cwd(), '.env.test');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) {
    env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
  }
}

const SUPABASE_URL = env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  logError('Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.test');
  process.exit(1);
}

const isDryRun = !process.argv.includes('--execute');

// --- Obtener proveedores existentes ---
async function getProveedores() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/proveedores?select=id,nombre,cuit&order=nombre`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Error fetching proveedores: ${res.status}`);
  return res.json();
}

// --- Obtener profiles existentes ---
async function getExistingProfiles() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/supplier_profiles?select=id,proveedor_id`, {
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Error fetching profiles: ${res.status}`);
  return res.json();
}

// --- Insertar profiles ---
async function insertProfiles(profiles) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/supplier_profiles`, {
    method: 'POST',
    headers: {
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(profiles),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Error inserting profiles: ${res.status} ${body}`);
  }
  return res.json();
}

// --- Definiciones de profiles basadas en BRIEFING sección 6 ---
function buildProfiles(proveedoresMap) {
  const profiles = [];

  // 6.1 — Logismar S.R.L. (La Galletera)
  // Tiene columna UxB explícita. Precio es por bulto.
  const logismar = proveedoresMap['Logismar S.R.L. (La Galletera)'];
  if (logismar) {
    profiles.push({
      proveedor_id: logismar.id,
      precio_es_bulto: true,
      iva_incluido: false,
      iva_tasa: 21.00,
      pack_size_regex: null,  // UxB explícito en columna, no requiere regex
      notas: 'La Galletera / Logismar. Columna UxB explícita indica unidades por bulto. Precio = precio por bulto. Fórmula: precio / UxB. Productos: galletitas artesanales, panificación. CUIT: 30-70804363-6.',
      activo: true,
    });
  }

  // 6.2 — CPV S.R.L. (Fargo, Lucchetti, etc.)
  // Pack size codificado en nombre: "NOMBRE NxM" donde N = unidades/bulto
  const cpv = proveedoresMap['CPV S.R.L.'];
  if (cpv) {
    profiles.push({
      proveedor_id: cpv.id,
      precio_es_bulto: true,
      iva_incluido: false,
      iva_tasa: 21.00,
      pack_size_regex: '(\\d+)\\s*[xX]\\s*\\d+',  // Captura N de NxM (ej: "20X500" → 20)
      notas: 'CPV S.R.L. (Fargo, Lucchetti, Don Vicente, Paulina, Jet Food, Granja del Sol). No tiene col UxB. Pack size en nombre: NxM donde N=unidades/bulto. Fórmula: P.Unitario / N. Validar subtotal = P.Unitario × Bultos. CUIT: 33-66641681-9.',
      activo: true,
    });
  }

  // 6.3 — AceituMar S.A.
  // Precio ya es por unidad. IVA desglosado por separado.
  const aceitumar = proveedoresMap['AceituMar S.A.'];
  if (aceitumar) {
    profiles.push({
      proveedor_id: aceitumar.id,
      precio_es_bulto: false,
      iva_incluido: false,
      iva_tasa: 21.00,
      pack_size_regex: null,  // No aplica, precio es unitario
      notas: 'AceituMar S.A. / La Delfina. Precio por unidad (no por bulto). IVA desglosado aparte. Productos: frutos secos, chocolates, snacks, aceitunas. Condición: Cuenta Corriente. CUIT: 30-71533519-7.',
      activo: true,
    });
  }

  // 6.4 — Terramare del Sur S.R.L. (Mondelez/Terrabusi)
  // Estructura compleja: AxBxC en nombre. Cantidades con signo negativo.
  const terramare = proveedoresMap['Terramare del Sur S.R.L.'];
  if (terramare) {
    profiles.push({
      proveedor_id: terramare.id,
      precio_es_bulto: true,
      iva_incluido: false,
      iva_tasa: 21.00,
      pack_size_regex: '(\\d+)\\s*[xX]\\s*(\\d+)(?:\\s*[xX]\\s*[\\d.]+)?',  // Captura AxBxC: A*B=unidades
      notas: 'Terramare del Sur (Mondelez: Milka, Oreo, Pepitos, Tita, Tang, Clight). Cantidades con signo negativo (formato propio). Nombre: AxBxC donde total_unidades = A×B (C=peso). Si solo AxC → A unidades. Fórmula: precio / total_unidades. CUIT: 30-71136826-4.',
      activo: true,
    });
  }

  // 6.5 — Urrestarazu y Cedeira S.R.L. (Lista de precios vinos)
  // No es factura, es lista de precios. Precio ya unitario.
  const cedeira = proveedoresMap['Urrestarazu y Cedeira S.R.L.'];
  if (cedeira) {
    profiles.push({
      proveedor_id: cedeira.id,
      precio_es_bulto: false,
      iva_incluido: false,
      iva_tasa: 21.00,
      pack_size_regex: null,
      notas: 'Urrestarazu y Cedeira (vinos, licores, aperitivos). Docs son LISTA DE PRECIOS, no facturas. Precio unitario por botella. Verificar fecha de vigencia antes de aplicar. Precios con muchos decimales (no redondeados).',
      activo: true,
    });
  }

  return profiles;
}

// --- Main ---
async function main() {
  console.log(`\n=== Seed Supplier Profiles ${isDryRun ? '(DRY-RUN)' : '(EXECUTE)'} ===\n`);

  // 1) Proveedores
  const proveedores = await getProveedores();
  console.log(`Proveedores en BD: ${proveedores.length}`);
  const provMap = {};
  for (const p of proveedores) {
    provMap[p.nombre] = p;
  }

  // 2) Profiles existentes
  const existing = await getExistingProfiles();
  const existingProvIds = new Set(existing.map(e => e.proveedor_id));
  console.log(`Profiles existentes: ${existing.length}`);

  // 3) Construir profiles
  const allProfiles = buildProfiles(provMap);
  const newProfiles = allProfiles.filter(p => !existingProvIds.has(p.proveedor_id));
  const skipped = allProfiles.length - newProfiles.length;

  console.log(`Profiles a crear: ${newProfiles.length} (skipped duplicados: ${skipped})`);

  if (newProfiles.length === 0) {
    console.log('\nNada que insertar. Todos los profiles ya existen.');
    return;
  }

  // 4) Mostrar detalle
  for (const p of newProfiles) {
    const provName = proveedores.find(pr => pr.id === p.proveedor_id)?.nombre || '???';
    console.log(`\n  [${isDryRun ? 'DRY' : 'INSERT'}] ${provName}`);
    console.log(`    precio_es_bulto: ${p.precio_es_bulto}`);
    console.log(`    iva_incluido: ${p.iva_incluido}`);
    console.log(`    iva_tasa: ${p.iva_tasa}`);
    console.log(`    pack_size_regex: ${p.pack_size_regex || '(ninguno)'}`);
    console.log(`    notas: ${p.notas.slice(0, 80)}...`);
  }

  if (isDryRun) {
    console.log('\n[DRY-RUN] No se insertó nada. Usa --execute para insertar.\n');
    return;
  }

  // 5) Insertar
  const result = await insertProfiles(newProfiles);
  console.log(`\n✅ Insertados: ${result.length} profiles`);
  for (const r of result) {
    const provName = proveedores.find(pr => pr.id === r.proveedor_id)?.nombre || '???';
    console.log(`  ${r.id} → ${provName}`);
  }
  console.log('');
}

main().catch(err => {
  logError(`FATAL: ${err.message}`);
  process.exit(1);
});
