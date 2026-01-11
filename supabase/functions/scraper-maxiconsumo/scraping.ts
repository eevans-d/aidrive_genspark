/**
 * Modulo de scraping principal para scraper-maxiconsumo
 * @module scraper-maxiconsumo/scraping
 */

import type { ProductoMaxiconsumo, StructuredLog, CategoriaConfig } from './types.ts';
import { MAXICONSUMO_BASE_URL, isValidScraperUrl, sanitizeSlug } from './types.ts';
import { 
  delay, 
  getRandomDelay, 
  generateAdvancedHeaders, 
  fetchWithAdvancedAntiDetection,
  isProxyEffectivelyEnabled,
  isCaptchaServiceEnabled,
  getEffectiveProxyUrl
} from './anti-detection.ts';
import { extractProductosConOptimizacion, calculateConfidenceScore, generateContentHash } from './parsing.ts';
import { obtenerConfiguracionCategorias, validateOptionalFeatures } from './config.ts';
import { createLogger } from '../_shared/logger.ts';
import { isCookieJarEnabled, getCookieJarStats } from './utils/cookie-jar.ts';

const logger = createLogger('scraper-maxiconsumo:scraping');

/**
 * Inicializa y loggea el estado de features opcionales al inicio del scraping
 */
function logOptionalFeaturesStatus(requestId: string): void {
  const status = validateOptionalFeatures();
  const cookieJarStats = getCookieJarStats();
  
  logger.info('OPTIONAL_FEATURES_STATUS', {
    requestId,
    proxy: {
      enabled: status.proxyEnabled,
      valid: status.proxyValid,
      active: status.proxyValid
    },
    captcha: {
      enabled: status.captchaEnabled,
      valid: status.captchaValid,
      active: status.captchaValid
    },
    cookieJar: {
      enabled: cookieJarStats.enabled,
      hostsWithCookies: cookieJarStats.hostsWithCookies,
      totalCookies: cookieJarStats.totalCookies
    }
  });
}

export async function scrapeCategoriaOptimizado(
  categoria: string, config: CategoriaConfig, structuredLog: StructuredLog
): Promise<ProductoMaxiconsumo[]> {
  const requestId = structuredLog.requestId || crypto.randomUUID();
  logger.info('CATEGORY_SCRAPING_START', { ...structuredLog, categoria, requestId });

  const safeSlug = sanitizeSlug(config.slug);
  if (!safeSlug) {
    throw new Error(`Invalid category slug: ${config.slug}`);
  }

  const headers = generateAdvancedHeaders();
  let captchaDetected = false, retryCount = 0;
  const maxRetries = 5;

  try {
    const ts = Date.now(), rand = Math.random().toString(36).substring(2, 8);
    const urlCategoria = `${MAXICONSUMO_BASE_URL}categoria/${safeSlug}?t=${ts}&r=${rand}`;

    if (!isValidScraperUrl(urlCategoria)) {
      throw new Error(`Invalid URL generated: blocked by allowlist`);
    }

    let response: Response | undefined;
    while (retryCount < maxRetries) {
      try {
        const baseDelay = Math.min(2000 * Math.pow(1.5, retryCount), 15000);
        await delay(getRandomDelay(baseDelay * 0.8, baseDelay * 1.2));
        response = await fetchWithAdvancedAntiDetection(urlCategoria, headers, structuredLog);
        break;
      } catch (e) {
        retryCount++;
        if (retryCount >= maxRetries) {
          logger.warn('RETRY_MAX_REACHED', { requestId, categoria, attempt: retryCount });
          throw new Error(`Max retries exceeded`);
        }
        logger.warn('RETRY', { requestId, categoria, attempt: retryCount });
      }
    }

    if (!response?.ok) {
      throw new Error(`HTTP error: ${response?.status || 'no response'}`);
    }

    const html = await response.text();
    const productos = await extractProductosConOptimizacion(html, categoria, MAXICONSUMO_BASE_URL, structuredLog);
    
    for (const p of productos) {
      const content = `${p.nombre}-${p.precio_unitario}-${p.stock_disponible}`;
      p.hash_contenido = await generateContentHash(content);
      p.score_confiabilidad = calculateConfidenceScore(p);
      p.metadata = {
        ...p.metadata,
        extracted_at: new Date().toISOString(),
        captcha_encountered: captchaDetected,
        retry_count: retryCount
      };
    }

    logger.info('EXTRACTION_COMPLETE', { requestId, categoria, count: productos.length });
    return productos;
  } catch (e) {
    logger.error('CATEGORY_ERROR', { requestId, categoria });
    throw e;
  }
}

export async function ejecutarScrapingCompleto(
  structuredLog: StructuredLog,
  _supabaseUrl: string,
  _serviceRoleKey: string
): Promise<{
  productos: ProductoMaxiconsumo[];
  categorias_procesadas: number;
  errores: string[];
}> {
  const requestId = structuredLog.requestId || crypto.randomUUID();
  logger.info('SCRAPING_START', { requestId });

  // Loggear estado de features opcionales al inicio
  logOptionalFeaturesStatus(requestId);

  const categorias = obtenerConfiguracionCategorias();
  const productos: ProductoMaxiconsumo[] = [];
  const errores: string[] = [];
  let categoriasOk = 0;

  const sortedCats = Object.entries(categorias).sort(([, a], [, b]) => a.prioridad - b.prioridad);

  for (const [nombre, config] of sortedCats) {
    try {
      const prods = await scrapeCategoriaOptimizado(nombre, config, { ...structuredLog, requestId });
      productos.push(...prods.slice(0, config.max_productos));
      categoriasOk++;
      await delay(getRandomDelay(2000, 4000));
    } catch (e) {
      logger.error('CATEGORY_SCRAPING_FAILED', { requestId, categoria: nombre });
      errores.push(nombre);
    }
  }

  logger.info('SCRAPING_COMPLETE', { requestId, productos: productos.length, categorias: categoriasOk, errores: errores.length });
  return { productos, categorias_procesadas: categoriasOk, errores };
}
