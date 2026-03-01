#!/usr/bin/env node
/**
 * ocr-reasignar-proveedor.mjs
 * 
 * Post-OCR: reasigna proveedor_id de facturas_ingesta según CUIT detectado
 * por el OCR o por heurística manual (timestamps de fotos).
 * 
 * Uso:
 *   node scripts/ocr-reasignar-proveedor.mjs --dry-run     # (default) muestra cambios
 *   node scripts/ocr-reasignar-proveedor.mjs --execute      # aplica cambios
 *   node scripts/ocr-reasignar-proveedor.mjs --status       # solo muestra estado actual
 * 
 * Estrategia de reasignación (en orden de prioridad):
 *   1. CUIT detectado en texto OCR → cruce con proveedores.cuit
 *   2. Heurística temporal: fotos tomadas en secuencia rápida = mismo proveedor
 *   3. Manual: mapeo por archivo para casos no resueltos
 * 
 * Requiere: SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.test
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// --- Cargar .env.test ---
function loadEnv() {
  const envPath = resolve(ROOT, '.env.test');
  const content = readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      process.env[trimmed.slice(0, eqIdx)] = trimmed.slice(eqIdx + 1);
    }
  }
}

// --- API helpers ---
async function apiFetch(path, options = {}) {
  const url = `${process.env.SUPABASE_URL}${path}`;
  const headers = {
    'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json();
}

// --- Obtener datos ---
async function getFacturas() {
  return apiFetch('/rest/v1/facturas_ingesta?select=id,numero,estado,proveedor_id,imagen_url&order=created_at');
}

async function getProveedores() {
  return apiFetch('/rest/v1/proveedores?select=id,nombre,cuit&order=nombre');
}

async function getEventos() {
  return apiFetch('/rest/v1/facturas_ingesta_eventos?select=factura_id,tipo,datos&tipo=in.(ocr_ok,ocr_error)&order=created_at.desc');
}

// --- Extraer timestamp de nombre de archivo para agrupación temporal ---
function extractTimestamp(numero) {
  // numero format: BATCH-20260227_HHMMSS
  const match = numero?.match(/BATCH-(\d{8})_(\d{6})/);
  if (!match) return null;
  const [, date, time] = match;
  const h = parseInt(time.slice(0, 2));
  const m = parseInt(time.slice(2, 4));
  const s = parseInt(time.slice(4, 6));
  return h * 3600 + m * 60 + s; // Seconds since midnight
}

// --- Agrupar por proximidad temporal (30s gap = nuevo grupo) ---
function groupByTimestamp(facturas, gapThreshold = 30) {
  const sorted = facturas
    .map(f => ({ ...f, ts: extractTimestamp(f.numero) }))
    .filter(f => f.ts !== null)
    .sort((a, b) => a.ts - b.ts);

  const groups = [];
  let currentGroup = [];

  for (const f of sorted) {
    if (currentGroup.length === 0) {
      currentGroup.push(f);
    } else {
      const lastTs = currentGroup[currentGroup.length - 1].ts;
      if (f.ts - lastTs > gapThreshold) {
        groups.push([...currentGroup]);
        currentGroup = [f];
      } else {
        currentGroup.push(f);
      }
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  return groups;
}

// --- CUIT normalization ---
function normalizeCuit(cuit) {
  if (!cuit) return null;
  return cuit.replace(/[-\s]/g, '');
}

// --- Reasignación por CUIT ---
function buildCuitMap(proveedores) {
  const map = new Map();
  for (const p of proveedores) {
    if (p.cuit) {
      map.set(normalizeCuit(p.cuit), p);
    }
  }
  return map;
}

// --- Buscar CUIT en eventos OCR ---
function findCuitInEvents(facturaId, eventos) {
  const facEvents = eventos.filter(e => e.factura_id === facturaId && e.tipo === 'ocr_ok');
  for (const ev of facEvents) {
    const datos = typeof ev.datos === 'string' ? JSON.parse(ev.datos) : ev.datos;
    if (datos?.cuit_detectado) return datos.cuit_detectado;
    if (datos?.texto_completo) {
      // Buscar patrón CUIT en texto
      const cuitMatch = datos.texto_completo.match(/\b(\d{2})-?(\d{8})-?(\d)\b/);
      if (cuitMatch) return `${cuitMatch[1]}-${cuitMatch[2]}-${cuitMatch[3]}`;
    }
  }
  return null;
}

// --- Main ---
async function main() {
  const mode = process.argv.includes('--execute') ? 'execute' :
    process.argv.includes('--status') ? 'status' : 'dry-run';

  loadEnv();

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.test');
    process.exit(1);
  }

  console.log(`\n=== Reasignación de Proveedor [${mode.toUpperCase()}] ===\n`);

  const [facturas, proveedores, eventos] = await Promise.all([
    getFacturas(),
    getProveedores(),
    getEventos().catch(() => []),
  ]);

  console.log(`Facturas: ${facturas.length}`);
  console.log(`Proveedores: ${proveedores.length}`);
  console.log(`Eventos OCR: ${eventos.length}`);

  const cuitMap = buildCuitMap(proveedores);
  const placeholderProvId = 'd634fd98-6446-4a0c-a617-960f6fcdfee8'; // Logismar placeholder

  // --- Paso 1: Identificar facturas con placeholder ---
  const toReassign = facturas.filter(f => f.proveedor_id === placeholderProvId);
  const alreadyAssigned = facturas.filter(f => f.proveedor_id !== placeholderProvId);

  console.log(`\nCon placeholder (Logismar): ${toReassign.length}`);
  console.log(`Ya asignadas correctamente: ${alreadyAssigned.length}`);

  if (toReassign.length === 0) {
    console.log('\n✅ No hay facturas pendientes de reasignación.\n');
    return;
  }

  // --- Paso 2: Intentar reasignación por CUIT detectado ---
  const reassignments = [];

  for (const f of toReassign) {
    const cuitDetected = findCuitInEvents(f.id, eventos);
    if (cuitDetected) {
      const normalized = normalizeCuit(cuitDetected);
      const prov = cuitMap.get(normalized);
      if (prov) {
        reassignments.push({
          factura_id: f.id,
          numero: f.numero,
          oldProv: placeholderProvId,
          newProv: prov.id,
          newProvName: prov.nombre,
          method: 'cuit',
          cuit: cuitDetected,
        });
        continue;
      }
    }
    // Sin CUIT → pendiente
    reassignments.push({
      factura_id: f.id,
      numero: f.numero,
      oldProv: placeholderProvId,
      newProv: null,
      newProvName: null,
      method: 'pending',
      cuit: cuitDetected,
    });
  }

  // --- Paso 3: Heurística temporal para los pendientes ---
  const pending = reassignments.filter(r => r.method === 'pending');
  if (pending.length > 0) {
    const groups = groupByTimestamp(toReassign);
    console.log(`\nGrupos temporales detectados: ${groups.length}`);
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const first = g[0].numero?.replace('BATCH-', '') || '';
      const last = g[g.length - 1].numero?.replace('BATCH-', '') || '';
      console.log(`  Grupo ${i + 1}: ${g.length} imágenes (${first} → ${last})`);

      // Si alguna factura del grupo ya tiene CUIT → propagar al grupo
      const groupReassignments = reassignments.filter(r =>
        g.some(f => f.id === r.factura_id)
      );
      const resolved = groupReassignments.find(r => r.method === 'cuit');
      if (resolved) {
        for (const r of groupReassignments) {
          if (r.method === 'pending') {
            r.newProv = resolved.newProv;
            r.newProvName = resolved.newProvName;
            r.method = 'temporal_group';
          }
        }
      }
    }
  }

  // --- Reporte ---
  const byCuit = reassignments.filter(r => r.method === 'cuit');
  const byTemporal = reassignments.filter(r => r.method === 'temporal_group');
  const stillPending = reassignments.filter(r => r.method === 'pending');

  console.log(`\n--- Resultados de Reasignación ---`);
  console.log(`  Por CUIT detectado: ${byCuit.length}`);
  console.log(`  Por grupo temporal: ${byTemporal.length}`);
  console.log(`  Pendientes (sin resolver): ${stillPending.length}`);

  const toApply = reassignments.filter(r => r.newProv && r.newProv !== r.oldProv);

  if (toApply.length > 0) {
    console.log(`\nCambios a aplicar:`);
    for (const r of toApply) {
      console.log(`  ${r.numero} → ${r.newProvName} [${r.method}] cuit=${r.cuit || '—'}`);
    }
  }

  if (stillPending.length > 0) {
    console.log(`\nFacturas sin resolver (requieren OCR o asignación manual):`);
    for (const r of stillPending) {
      console.log(`  ${r.numero} [cuit=${r.cuit || 'no detectado'}]`);
    }
  }

  if (mode === 'status') {
    console.log('\n[STATUS] Solo lectura.\n');
    return;
  }

  if (mode === 'dry-run') {
    console.log(`\n[DRY-RUN] ${toApply.length} cambios listados. Usar --execute para aplicar.\n`);
    return;
  }

  // --- Execute ---
  if (toApply.length === 0) {
    console.log('\n✅ No hay cambios para aplicar (OCR aún no ha detectado CUITs).\n');
    return;
  }

  let applied = 0;
  for (const r of toApply) {
    try {
      await apiFetch(`/rest/v1/facturas_ingesta?id=eq.${r.factura_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ proveedor_id: r.newProv }),
      });
      applied++;
      console.log(`  ✅ ${r.numero} → ${r.newProvName}`);
    } catch (err) {
      console.error(`  ❌ ${r.numero}: ${err.message}`);
    }
  }

  console.log(`\n✅ Aplicados: ${applied}/${toApply.length}\n`);
}

main().catch(err => {
  console.error('FATAL:', err.message);
  process.exit(1);
});
