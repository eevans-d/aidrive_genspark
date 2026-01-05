/**
 * Tipos compartidos para scraper-maxiconsumo
 * @module scraper-maxiconsumo/types
 */

// ============================================================================
// INTERFACES DE PRODUCTO
// ============================================================================

export interface ProductoMaxiconsumo {
  sku: string;
  nombre: string;
  marca?: string;
  categoria?: string;
  precio_unitario: number;
  precio_promocional?: number;
  stock_disponible?: number;
  stock_nivel_minimo?: number;
  codigo_barras?: string;
  url_producto?: string;
  imagen_url?: string;
  descripcion?: string;
  hash_contenido?: string;
  score_confiabilidad?: number;
  ultima_actualizacion: string;
  metadata?: ProductoMetadata;
}

export interface ProductoMetadata {
  extracted_at?: string;
  categoria?: string;
  captcha_encountered?: boolean;
  retry_count?: number;
  extracted_by_pattern?: number;
  match_position?: number;
  updated_at?: string;
  confidence_score?: number;
}

// ============================================================================
// INTERFACES DE CACHÉ
// ============================================================================

export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
}

// ============================================================================
// INTERFACES DE MÉTRICAS
// ============================================================================

export interface RequestMetrics {
  total: number;
  successful: number;
  failed: number;
  averageResponseTime: number;
}

export interface ScrapingMetrics {
  categoriesScraped: number;
  productsExtracted: number;
  errorsEncountered: number;
  captchasDetected: number;
}

export interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
}

export interface PerformanceMetrics {
  memoryUsage: MemoryMetrics;
  requestMetrics: RequestMetrics;
  scrapingMetrics: ScrapingMetrics;
}

// ============================================================================
// INTERFACES DE ANTI-DETECCIÓN
// ============================================================================

export interface AntiDetectionConfig {
  minDelay: number;
  maxDelay: number;
  jitterFactor: number;
  userAgentRotation: boolean;
  headerRandomization: boolean;
  captchaBypass: boolean;
}

// ============================================================================
// INTERFACES DE COMPARACIÓN
// ============================================================================

export interface ComparacionPrecio {
  producto_id: string;
  nombre_producto: string;
  precio_actual: number;
  precio_proveedor: number;
  diferencia_absoluta: number;
  diferencia_porcentual: number;
  fuente: string;
  fecha_comparacion: string;
  es_oportunidad_ahorro: boolean;
  recomendacion: string;
  confidence_score?: number;
}

export interface MatchResult {
  producto_proveedor: ProductoMaxiconsumo;
  producto_sistema: Record<string, unknown>;
  match_strategy: 'sku_exact' | 'barcode_exact' | 'name_similarity' | 'fuzzy_matching' | 'none';
  confidence: number;
  fuzzy_score?: number;
}

// ============================================================================
// INTERFACES DE ALERTAS
// ============================================================================

export type Severidad = 'baja' | 'media' | 'alta' | 'critica';
export type TipoCambio = 'aumento' | 'disminucion' | 'nuevo_producto';
export type Tendencia = 'ascendente' | 'descendente' | 'estable' | 'volatil';
export type VelocidadCambio = 'lenta' | 'normal' | 'rapida';

export interface AlertaCambio {
  producto_id: string;
  nombre_producto: string;
  tipo_cambio: TipoCambio;
  valor_anterior?: number;
  valor_nuevo?: number;
  porcentaje_cambio?: number;
  severidad: Severidad;
  mensaje: string;
  fecha_alerta: string;
  accion_recomendada: string;
  metadata?: AlertaMetadata;
}

export interface AlertaMetadata {
  cambio_velocidad?: VelocidadCambio;
  tendencia?: Tendencia;
  confianza?: number;
}

// ============================================================================
// INTERFACES DE CONFIGURACIÓN
// ============================================================================

export interface CategoriaConfig {
  slug: string;
  prioridad: number;
  max_productos: number;
  captchaBypass?: boolean;
}

export interface ScraperConfig {
  categorias: Record<string, CategoriaConfig>;
  antiDetection: AntiDetectionConfig;
  batchSize: number;
  maxRetries: number;
  timeout: number;
}

// ============================================================================
// INTERFACES DE LOGGING ESTRUCTURADO
// ============================================================================

export interface StructuredLog {
  requestId?: string;
  event?: string;
  timestamp?: string;
  [key: string]: unknown;
}

// ============================================================================
// INTERFACES DE CIRCUIT BREAKER
// ============================================================================

export interface CircuitBreakerOptions {
  failureThreshold: number;
  successThreshold: number;
  openTimeoutMs: number;
}

// ============================================================================
// CONSTANTES
// ============================================================================

export const MAXICONSUMO_BASE_URL = 'https://maxiconsumo.com/sucursal_necochea/';
export const FUENTE_MAXICONSUMO = 'Maxiconsumo Necochea';
export const DEFAULT_BATCH_SIZE = 50;
export const DEFAULT_MAX_RETRIES = 5;
export const DEFAULT_TIMEOUT = 20000;
export const CACHE_MAX_SIZE = 1000;
export const CACHE_DEFAULT_TTL = 300000; // 5 minutes
