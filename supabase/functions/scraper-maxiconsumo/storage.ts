/**
 * Módulo de storage/DB para scraper-maxiconsumo
 * @module scraper-maxiconsumo/storage
 */

import type { ProductoMaxiconsumo, ComparacionPrecio, AlertaCambio, StructuredLog } from './types.ts';
import { FUENTE_MAXICONSUMO } from './types.ts';
import { delay } from './anti-detection.ts';

function splitIntoBatches<T>(arr: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += size) batches.push(arr.slice(i, i + size));
  return batches;
}

async function supabaseFetch(url: string, key: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, {
    ...options,
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
    } catch { /* continue */ }
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
    console.log(JSON.stringify({ ...log, event: 'BATCH_INSERT_SUCCESS', count: inserted.length }));
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
      } catch { /* continue */ }
    }
    await delay(100);
  }
  console.log(JSON.stringify({ ...log, event: 'BATCH_UPDATE_COMPLETE', count: updated }));
  return updated;
}

export async function guardarProductosExtraidosOptimizado(
  productos: ProductoMaxiconsumo[], supabaseUrl: string, key: string, log: StructuredLog
): Promise<number> {
  if (!productos.length) return 0;
  
  const skus = productos.map(p => p.sku).filter(Boolean);
  const existing = await bulkCheckExistingProducts(skus, supabaseUrl, key);
  const existingSkus = new Set(existing.map(p => p.sku));
  
  const nuevos = productos.filter(p => !existingSkus.has(p.sku));
  const existentes = productos.filter(p => existingSkus.has(p.sku));
  
  let total = 0;
  for (const batch of splitIntoBatches(nuevos, 50)) total += await batchInsertProducts(batch, supabaseUrl, key, log);
  for (const batch of splitIntoBatches(existentes, 50)) total += await batchUpdateProducts(batch, supabaseUrl, key, log);
  
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
  console.log(JSON.stringify({ ...log, event: 'COMPARISONS_SAVED', count: saved }));
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
  console.log(JSON.stringify({ ...log, event: 'ALERTS_SAVED', count: saved }));
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
