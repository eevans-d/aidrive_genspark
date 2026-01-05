/**
 * Módulo de matching de productos para scraper-maxiconsumo
 * @module scraper-maxiconsumo/matching
 */

import type { MatchResult, ComparacionPrecio, StructuredLog } from './types.ts';
import { FUENTE_MAXICONSUMO } from './types.ts';

export function normalizeProductName(name: string): string {
  return name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeProductName(name1), n2 = normalizeProductName(name2);
  if (n1 === n2) return 85;
  const w1 = new Set(n1.split(' ')), w2 = new Set(n2.split(' '));
  const common = [...w1].filter(w => w2.has(w)).length;
  const total = new Set([...w1, ...w2]).size;
  return total === 0 ? 0 : Math.round((common / total) * 80);
}

export function calculateMatchConfidence(match: MatchResult): number {
  let conf = match.confidence || 50;
  if (match.producto_proveedor.codigo_barras && match.producto_sistema.codigo_barras) conf += 10;
  if (match.producto_proveedor.marca && match.producto_sistema.marca) {
    if (normalizeProductName(match.producto_proveedor.marca) === normalizeProductName(String(match.producto_sistema.marca))) conf += 15;
  }
  const pProv = match.producto_proveedor.precio_unitario || 0;
  const pSist = Number(match.producto_sistema.precio_actual) || 0;
  if (pProv > 0 && pSist > 0 && Math.abs(pProv - pSist) / Math.max(pProv, pSist) < 0.1) conf += 10;
  return Math.min(100, conf);
}

export async function performAdvancedMatching(
  productosProveedor: any[], productosSistema: any[], structuredLog: StructuredLog
): Promise<MatchResult[]> {
  const matches: MatchResult[] = [];
  const skuIdx = new Map(), barcodeIdx = new Map(), nameIdx = new Map<string, any[]>();
  
  for (const p of productosSistema) {
    if (p.sku) skuIdx.set(p.sku, p);
    if (p.codigo_barras) barcodeIdx.set(p.codigo_barras, p);
    if (p.nombre) {
      const n = normalizeProductName(p.nombre);
      if (!nameIdx.has(n)) nameIdx.set(n, []);
      nameIdx.get(n)!.push(p);
    }
  }

  for (const pProv of productosProveedor) {
    let match = null, strategy: MatchResult['match_strategy'] = 'none', conf = 0;
    
    if (pProv.sku && skuIdx.has(pProv.sku)) {
      match = skuIdx.get(pProv.sku); strategy = 'sku_exact'; conf = 95;
    } else if (pProv.codigo_barras && barcodeIdx.has(pProv.codigo_barras)) {
      match = barcodeIdx.get(pProv.codigo_barras); strategy = 'barcode_exact'; conf = 90;
    } else {
      const nProv = normalizeProductName(pProv.nombre);
      const sistProds = nameIdx.get(nProv);
      if (sistProds?.length) {
        match = sistProds[0]; strategy = 'name_similarity'; conf = calculateNameSimilarity(pProv.nombre, match.nombre);
      }
    }
    
    if (!match) {
      const fuzzy = performFuzzyMatching(pProv, productosSistema);
      if (fuzzy) { match = fuzzy; strategy = 'fuzzy_matching'; conf = fuzzy.fuzzy_score || 30; }
    }
    
    if (match && conf > 20) {
      matches.push({ producto_proveedor: pProv, producto_sistema: match, match_strategy: strategy, confidence: conf });
    }
  }
  
  console.log(JSON.stringify({ ...structuredLog, event: 'MATCHING_COMPLETE', total: matches.length }));
  return matches;
}

function performFuzzyMatching(pProv: any, productosSistema: any[]): any | null {
  let best = null, bestScore = 0;
  for (let i = 0; i < Math.min(100, productosSistema.length); i++) {
    const pSist = productosSistema[i];
    if (!pSist.nombre) continue;
    const score = calculateNameSimilarity(pProv.nombre, pSist.nombre);
    if (score > bestScore && score > 40) { bestScore = score; best = { ...pSist, fuzzy_score: score }; }
  }
  return best;
}

export function generateComparacion(match: MatchResult, confidence: number): ComparacionPrecio {
  const pActual = parseFloat(match.producto_sistema.precio_actual as string) || 0;
  const pProv = match.producto_proveedor.precio_unitario || 0;
  const diffAbs = pActual - pProv;
  const diffPct = pProv > 0 ? (diffAbs / pProv) * 100 : 0;

  return {
    producto_id: String(match.producto_sistema.id),
    nombre_producto: String(match.producto_sistema.nombre),
    precio_actual: pActual,
    precio_proveedor: pProv,
    diferencia_absoluta: Math.abs(diffAbs),
    diferencia_porcentual: Math.abs(diffPct),
    fuente: FUENTE_MAXICONSUMO,
    fecha_comparacion: new Date().toISOString(),
    es_oportunidad_ahorro: diffAbs > 0,
    recomendacion: generarRecomendacion(pActual, pProv, confidence),
    confidence_score: confidence
  };
}

function generarRecomendacion(pActual: number, pProv: number, confidence: number): string {
  const diff = pActual - pProv;
  const pct = pProv > 0 ? (diff / pProv) * 100 : 0;
  if (confidence < 50) return `⚠️ MATCH BAJO: Verificar (${confidence.toFixed(0)}%)`;
  if (pct > 25) return `🚨 OPORTUNIDAD CRÍTICA: ${pct.toFixed(1)}% ahorro - ${confidence.toFixed(0)}%`;
  if (pct > 15) return `💰 BUENA OPORTUNIDAD: ${pct.toFixed(1)}% ahorro - ${confidence.toFixed(0)}%`;
  if (pct > 5) return `📈 MEJORA MODERADA: ${pct.toFixed(1)}% - ${confidence.toFixed(0)}%`;
  if (diff > 0) return `⚖️ DIFERENCIA MENOR: ${pct.toFixed(1)}% - ${confidence.toFixed(0)}%`;
  return `📉 PRECIO SUPERIOR: Proveedor ${Math.abs(pct).toFixed(1)}% más caro`;
}
