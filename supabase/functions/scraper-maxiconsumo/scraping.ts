/**
 * Módulo de scraping principal para scraper-maxiconsumo
 * @module scraper-maxiconsumo/scraping
 */

import type { ProductoMaxiconsumo, StructuredLog, CategoriaConfig } from './types.ts';
import { MAXICONSUMO_BASE_URL } from './types.ts';
import { delay, getRandomDelay, generateAdvancedHeaders, fetchWithAdvancedAntiDetection, handleCaptchaBypass } from './anti-detection.ts';
import { extractProductosConOptimizacion, calculateConfidenceScore, generateContentHash } from './parsing.ts';
import { obtenerConfiguracionCategorias } from './config.ts';

export async function scrapeCategoriaOptimizado(
  categoria: string, config: CategoriaConfig, structuredLog: StructuredLog
): Promise<ProductoMaxiconsumo[]> {
  const log = { ...structuredLog, event: 'CATEGORY_SCRAPING_START', categoria };
  console.log(JSON.stringify(log));

  const headers = generateAdvancedHeaders();
  let captchaDetected = false, retryCount = 0;
  const maxRetries = 5;

  try {
    const ts = Date.now(), rand = Math.random().toString(36).substring(2, 8);
    const urlCategoria = `${MAXICONSUMO_BASE_URL}categoria/${config.slug}?t=${ts}&r=${rand}`;
    
    let response: Response | undefined;
    while (retryCount < maxRetries) {
      try {
        const baseDelay = Math.min(2000 * Math.pow(1.5, retryCount), 15000);
        await delay(getRandomDelay(baseDelay * 0.8, baseDelay * 1.2));
        response = await fetchWithAdvancedAntiDetection(urlCategoria, headers, log);
        break;
      } catch (e) {
        retryCount++;
        console.warn(JSON.stringify({ ...log, event: 'RETRY', attempt: retryCount, error: (e as Error).message }));
        if (retryCount >= maxRetries) throw new Error(`Max retries: ${(e as Error).message}`);
      }
    }

    if (!response?.ok) throw new Error(`HTTP ${response?.status}`);
    
    const html = await response.text();
    const productos = await extractProductosConOptimizacion(html, categoria, MAXICONSUMO_BASE_URL, log);
    
    // Post-process
    for (const p of productos) {
      const content = `${p.nombre}-${p.precio_unitario}-${p.stock_disponible}`;
      p.hash_contenido = await generateContentHash(content);
      p.score_confiabilidad = calculateConfidenceScore(p);
      p.metadata = { ...p.metadata, extracted_at: new Date().toISOString(), captcha_encountered: captchaDetected, retry_count: retryCount };
    }
    
    console.log(JSON.stringify({ ...log, event: 'EXTRACTION_COMPLETE', count: productos.length }));
    return productos;
  } catch (e) {
    console.error(JSON.stringify({ ...log, event: 'CATEGORY_ERROR', error: (e as Error).message }));
    throw e;
  }
}

export async function ejecutarScrapingCompleto(structuredLog: StructuredLog, supabaseUrl: string, serviceRoleKey: string): Promise<{
  productos: ProductoMaxiconsumo[], categorias_procesadas: number, errores: string[]
}> {
  const log = { ...structuredLog, event: 'SCRAPING_START' };
  console.log(JSON.stringify(log));
  
  const categorias = obtenerConfiguracionCategorias();
  const productos: ProductoMaxiconsumo[] = [];
  const errores: string[] = [];
  let categoriasOk = 0;

  const sortedCats = Object.entries(categorias).sort(([,a], [,b]) => a.prioridad - b.prioridad);
  
  for (const [nombre, config] of sortedCats) {
    try {
      const prods = await scrapeCategoriaOptimizado(nombre, config, structuredLog);
      productos.push(...prods.slice(0, config.max_productos));
      categoriasOk++;
      await delay(getRandomDelay(2000, 4000));
    } catch (e) {
      errores.push(`${nombre}: ${(e as Error).message}`);
    }
  }
  
  console.log(JSON.stringify({ ...log, event: 'SCRAPING_COMPLETE', productos: productos.length, categorias: categoriasOk, errores: errores.length }));
  return { productos, categorias_procesadas: categoriasOk, errores };
}
