/**
 * Módulo de storage/DB para scraper-maxiconsumo
 * @module scraper-maxiconsumo/storage
 * 
 * Separación de claves:
 * - readKey: para lecturas (SUPABASE_ANON_KEY si SCRAPER_READ_MODE=anon)
 * - writeKey: para escrituras (SUPABASE_SERVICE_ROLE_KEY siempre)
 */

import type { ProductoMaxiconsumo, ComparacionPrecio, AlertaCambio, StructuredLog } from './types.ts';
import { FUENTE_MAXICONSUMO } from './types.ts';
import { delay } from './anti-detection.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('scraper-maxiconsumo:storage');

function splitIntoBatches<T>(arr: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += size) batches.push(arr.slice(i, i + size));
  return batches;
}

async function supabaseFetch(url: string, key: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(10_000),
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json', ...options.headers }
  });
}

export async function bulkCheckExistingProducts(skus: string[], supabaseUrl: string, key: string): Promise<any[]> {
  const results: any[] = [];
  for (const chunk of splitIntoBatches(skus, 100)) {
    try {
      const q = `${supabaseUrl}/rest/v1/precios_proveedor?select=sku,id&sku=in.(${chunk.map(s => `"${s}"`).join(',')})`;
      const res = await supabaseFetch(q, key);
      if (res.ok) results.push(...await res.json());
    } catch (err) { logger.warn('BULK_CHECK_CHUNK_FAILED', { error: err instanceof Error ? err.message : String(err) }); }
  }
  return results;
}

export async function batchInsertProducts(productos: ProductoMaxiconsumo[], supabaseUrl: string, key: string, log: StructuredLog): Promise<number> {
  if (!productos.length) return 0;
  const data = productos.map(p => ({
    sku: p.sku, nombre: p.nombre, marca: p.marca, categoria: p.categoria,
    precio_unitario: p.precio_unitario, precio_promocional: p.precio_promocional,
    stock_disponible: p.stock_disponible, stock_nivel_minimo: p.stock_nivel_minimo,
    codigo_barras: p.codigo_barras, url_producto: p.url_producto,
    imagen_url: p.imagen_url, descripcion: p.descripcion,
    hash_contenido: p.hash_contenido, score_confiabilidad: p.score_confiabilidad,
    ultima_actualizacion: p.ultima_actualizacion, fuente: FUENTE_MAXICONSUMO, activo: true, metadata: p.metadata
  }));
  
  const res = await supabaseFetch(`${supabaseUrl}/rest/v1/precios_proveedor`, key, {
    method: 'POST', body: JSON.stringify(data), headers: { 'Prefer': 'return=representation' }
  });
  
  if (res.ok) {
    const inserted = await res.json();
    logger.info('BATCH_INSERT_SUCCESS', { ...log, count: inserted.length });
    return inserted.length;
  }
  return 0;
}

export async function batchUpdateProducts(productos: ProductoMaxiconsumo[], supabaseUrl: string, key: string, log: StructuredLog): Promise<number> {
  let updated = 0;
  for (const batch of splitIntoBatches(productos, 25)) {
    for (const p of batch) {
      try {
        const res = await supabaseFetch(`${supabaseUrl}/rest/v1/precios_proveedor?sku=eq.${encodeURIComponent(p.sku)}`, key, {
          method: 'PATCH', body: JSON.stringify({
            nombre: p.nombre, marca: p.marca, categoria: p.categoria,
            precio_unitario: p.precio_unitario, ultima_actualizacion: p.ultima_actualizacion, activo: true
          }), headers: { 'Prefer': 'return=representation' }
        });
        if (res.ok) updated++;
      } catch (err) { logger.warn('BATCH_UPDATE_ITEM_FAILED', { sku: p.sku, error: err instanceof Error ? err.message : String(err) }); }
    }
    await delay(100);
  }
  logger.info('BATCH_UPDATE_COMPLETE', { ...log, count: updated });
  return updated;
}

/**
 * Guarda productos extraídos con separación de claves:
 * - readKey: para bulkCheckExistingProducts (lectura)
 * - writeKey: para batchInsert/batchUpdate (escritura)
 */
export async function guardarProductosExtraidosOptimizado(
  productos: ProductoMaxiconsumo[], 
  supabaseUrl: string, 
  readKey: string, 
  writeKey: string, 
  log: StructuredLog
): Promise<number> {
  if (!productos.length) return 0;
  
  const skus = productos.map(p => p.sku).filter(Boolean);
  // Lectura con readKey
  const existing = await bulkCheckExistingProducts(skus, supabaseUrl, readKey);
  const existingSkus = new Set(existing.map(p => p.sku));
  
  const nuevos = productos.filter(p => !existingSkus.has(p.sku));
  const existentes = productos.filter(p => existingSkus.has(p.sku));
  
  // Escrituras con writeKey
  let total = 0;
  for (const batch of splitIntoBatches(nuevos, 50)) total += await batchInsertProducts(batch, supabaseUrl, writeKey, log);
  for (const batch of splitIntoBatches(existentes, 50)) total += await batchUpdateProducts(batch, supabaseUrl, writeKey, log);
  
  return total;
}

export async function batchSaveComparisons(comparaciones: ComparacionPrecio[], supabaseUrl: string, key: string, log: StructuredLog): Promise<number> {
  if (!comparaciones.length) return 0;
  let saved = 0;
  
  // Clean old
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseFetch(`${supabaseUrl}/rest/v1/comparacion_precios?fecha_comparacion=lt.${thirtyDaysAgo}`, key, { method: 'DELETE' });
  
  for (const batch of splitIntoBatches(comparaciones, 100)) {
    const payload = batch.map(c => ({
      producto_id: c.producto_id,
      nombre_producto: c.nombre_producto,
      precio_actual: c.precio_actual,
      precio_proveedor: c.precio_proveedor,
      diferencia_absoluta: c.diferencia_absoluta,
      diferencia_porcentual: c.diferencia_porcentual,
      fuente: c.fuente,
      fecha_comparacion: c.fecha_comparacion,
      es_oportunidad_ahorro: c.es_oportunidad_ahorro,
      recomendacion: c.recomendacion
    }));
    const res = await supabaseFetch(`${supabaseUrl}/rest/v1/comparacion_precios`, key, { method: 'POST', body: JSON.stringify(payload) });
    if (res.ok) saved += batch.length;
    await delay(50);
  }
  logger.info('COMPARISONS_SAVED', { ...log, count: saved });
  return saved;
}

export async function batchSaveAlerts(alertas: AlertaCambio[], supabaseUrl: string, key: string, log: StructuredLog): Promise<number> {
  if (!alertas.length) return 0;
  let saved = 0;
  
  // Clean old processed
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await supabaseFetch(`${supabaseUrl}/rest/v1/alertas_cambios_precios?procesada=eq.true&fecha_alerta=lt.${thirtyDaysAgo}`, key, { method: 'DELETE' });
  
  for (const batch of splitIntoBatches(alertas, 50)) {
    const data = batch.map(a => ({
      producto_id: a.producto_id,
      nombre_producto: a.nombre_producto,
      tipo_cambio: a.tipo_cambio,
      valor_anterior: a.valor_anterior ?? null,
      valor_nuevo: a.valor_nuevo ?? null,
      porcentaje_cambio: a.porcentaje_cambio ?? null,
      severidad: a.severidad,
      mensaje: a.mensaje,
      accion_recomendada: a.accion_recomendada,
      fecha_alerta: a.fecha_alerta,
      procesada: false
    }));
    const res = await supabaseFetch(`${supabaseUrl}/rest/v1/alertas_cambios_precios`, key, { method: 'POST', body: JSON.stringify(data) });
    if (res.ok) saved += batch.length;
    await delay(100);
  }
  logger.info('ALERTS_SAVED', { ...log, count: saved });
  return saved;
}

// Fetch helpers
export async function fetchProductosProveedor(supabaseUrl: string, key: string): Promise<any[]> {
  const productos: any[] = [];
  let offset = 0;
  while (true) {
    const res = await supabaseFetch(`${supabaseUrl}/rest/v1/precios_proveedor?select=*&fuente=eq.${encodeURIComponent(FUENTE_MAXICONSUMO)}&activo=eq.true&limit=500&offset=${offset}&order=sku.asc`, key);
    if (!res.ok) break;
    const batch = await res.json();
    if (!batch.length || productos.length > 10000) break;
    productos.push(...batch);
    offset += 500;
  }
  return productos;
}

export async function fetchProductosSistema(supabaseUrl: string, key: string): Promise<any[]> {
  const productos: any[] = [];
  let offset = 0;
  while (true) {
    const res = await supabaseFetch(`${supabaseUrl}/rest/v1/productos?select=*&activo=eq.true&limit=500&offset=${offset}&order=nombre.asc`, key);
    if (!res.ok) break;
    const batch = await res.json();
    if (!batch.length || productos.length > 10000) break;
    productos.push(...batch);
    offset += 500;
  }
  return productos;
}
