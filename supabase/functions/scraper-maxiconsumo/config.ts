/**
 * Módulo de configuración de categorías para scraper-maxiconsumo
 * @module scraper-maxiconsumo/config
 */

import type { CategoriaConfig, ScraperConfig, AntiDetectionConfig } from './types.ts';

export const DEFAULT_ANTI_DETECTION: AntiDetectionConfig = {
  minDelay: 1000, maxDelay: 5000, jitterFactor: 0.2,
  userAgentRotation: true, headerRandomization: true, captchaBypass: false
};

export function obtenerConfiguracionCategorias(): Record<string, CategoriaConfig> {
  return {
    'almacen': { slug: 'almacen', prioridad: 1, max_productos: 1000 },
    'bebidas': { slug: 'bebidas', prioridad: 2, max_productos: 500 },
    'limpieza': { slug: 'limpieza', prioridad: 3, max_productos: 300 },
    'frescos': { slug: 'frescos', prioridad: 4, max_productos: 200 },
    'congelados': { slug: 'congelados', prioridad: 5, max_productos: 200 },
    'perfumeria': { slug: 'perfumeria', prioridad: 6, max_productos: 150 },
    'mascotas': { slug: 'mascotas', prioridad: 7, max_productos: 100 },
    'hogar': { slug: 'hogar-y-bazar', prioridad: 8, max_productos: 150 },
    'electro': { slug: 'electro', prioridad: 9, max_productos: 100 }
  };
}

export function getDefaultScraperConfig(): ScraperConfig {
  return {
    categorias: obtenerConfiguracionCategorias(),
    antiDetection: DEFAULT_ANTI_DETECTION,
    batchSize: 50,
    maxRetries: 5,
    timeout: 20000
  };
}

export const MAXICONSUMO_BREAKER_OPTIONS = {
  failureThreshold: 5, successThreshold: 2, openTimeoutMs: 60000
};
