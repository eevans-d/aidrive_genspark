/**
 * Módulo de scraping principal para scraper-maxiconsumo
 * @module scraper-maxiconsumo/scraping
 */

import type { ProductoMaxiconsumo, StructuredLog, CategoriaConfig } from './types.ts';
import { MAXICONSUMO_BASE_URL } from './types.ts';
import { delay, getRandomDelay, generateAdvancedHeaders, fetchWithAdvancedAntiDetection, handleCaptchaBypass } from './anti-detection.ts';
import { extractProductosConOptimizacion, calculateConfidenceScore, generateContentHash } from './parsing.ts';
import { obtenerConfiguracionCategorias } from './config.ts';
import { createLogger } from '../_shared/logger.ts';

const logger = createLogger('scraper-maxiconsumo:scraping');

export async function scrapeCategoriaOptimizado(
  categoria: string, config: CategoriaConfig, structuredLog: StructuredLog
): Promise<ProductoMaxiconsumo[]> {
  logger.info('CATEGORY_SCRAPING_START', { ...structuredLog, categoria });

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
        if (retryCount >= maxRetries) {
          logger.warn('RETRY_MAX_REACHED', { ...structuredLog, categoria, attempt: retryCount, error: (e as Error).message });
          throw new Error(`Max retries: ${(e as Error).message}`);
        }
        logger.warn('RETRY', { ...structuredLog, categoria, attempt: retryCount, error: (e as Error).message });
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
    
    logger.info('EXTRACTION_COMPLETE', { ...structuredLog, categoria, count: productos.length });
    return productos;
  } catch (e) {
    logger.error('CATEGORY_ERROR', { ...structuredLog, categoria, error: (e as Error).message });
    throw e;
  }
}

export async function ejecutarScrapingCompleto(structuredLog: StructuredLog, supabaseUrl: string, serviceRoleKey: string): Promise<{
  productos: ProductoMaxiconsumo[], categorias_procesadas: number, errores: string[]
}> {
  const log = { ...structuredLog, event: 'SCRAPING_START' };
  logger.info('SCRAPING_START', structuredLog);
  
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
  
  logger.info('SCRAPING_COMPLETE', { ...structuredLog, productos: productos.length, categorias: categoriasOk, errores: errores.length });
  return { productos, categorias_procesadas: categoriasOk, errores };
}
