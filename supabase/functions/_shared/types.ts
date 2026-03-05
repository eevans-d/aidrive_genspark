// =============================================================================
// Shared types for Edge Functions — Row shapes from PostgREST queries
// =============================================================================

// --- Cron Jobs (cron-dashboard, cron-health-monitor, cron-jobs-maxiconsumo) ---

export interface CronJobTrackingRow {
  job_id: string;
  nombre_job: string;
  estado_job: string;
  ultima_ejecucion: string | null;
  proxima_ejecucion: string | null;
  duracion_ejecucion_ms: number;
  resultado_ultima_ejecucion?: Record<string, unknown> | null;
  configuracion?: Record<string, unknown> | null;
  circuit_breaker_state?: string;
  activo?: boolean;
  updated_at?: string;
}

export interface CronJobMetricsRow {
  job_id: string;
  fecha_metricas: string;
  ejecuciones_totales: number;
  disponibilidad_porcentual: number;
  tiempo_promedio_ms: number;
  alertas_generadas_total: number;
  uptime_porcentaje?: number;
}

export interface CronJobExecutionLogRow {
  id?: string;
  job_id?: string;
  start_time: string;
  estado: string;
  duracion_ms: number;
}

export interface CronJobAlertRow {
  id: string;
  tipo_alerta: string;
  severidad: string;
  titulo: string;
  descripcion: string;
  created_at: string;
  estado_alerta: string;
  fecha_resolucion?: string | null;
}

export interface MonitoringHistoryRow {
  uptime_percentage: number;
  timestamp?: string;
}

// --- Estadisticas Scraping (api-proveedor/utils/estadisticas) ---

export interface EstadisticaScrapingRow {
  productos_encontrados: number;
  status: string;
  tiempo_ejecucion_ms: number;
  created_at: string;
  categoria_procesada?: string;
}

// --- Oportunidades de Ahorro (api-proveedor/utils/comparacion) ---

export interface OportunidadAhorroRow {
  diferencia_absoluta: number;
  diferencia_porcentual: number;
  stock_disponible: number;
  ultima_actualizacion: string | null;
  categoria: string;
}

// --- Alertas (api-proveedor/utils/alertas, handlers/alertas) ---

export interface AlertaVistaRow {
  id?: string;
  producto_id?: string;
  nombre_producto?: string;
  tipo_cambio: string;
  severidad: string;
  fecha_alerta: string;
  diferencia_absoluta?: number;
  stock_disponible?: number;
  categoria?: string;
  procesada?: boolean;
  action_required?: boolean;
}

export interface AlertPattern {
  type: string;
  description: string;
  severity: string;
}

export interface AlertRiskScore {
  average_score: number;
  high_risk_count: number;
  risk_distribution: { low: number; medium: number; high: number };
}

export interface AlertInsight {
  type: string;
  message: string;
  urgency: string;
}

// --- Health (api-proveedor/utils/health, metrics) ---

export interface HealthComponent {
  status: string;
  score?: number;
  responseTime?: number;
  details?: Record<string, unknown>;
  avg_response_time_ms?: number;
  hit_rate?: number;
}

export interface HealthComponentMap {
  database?: HealthComponent;
  scraper?: HealthComponent;
  cache?: HealthComponent;
  memory?: HealthComponent;
  api_performance?: HealthComponent;
  external_deps?: HealthComponent;
  [key: string]: HealthComponent | undefined;
}

export interface HealthAlert {
  level: string;
  message: string;
  component?: string;
}

export interface HealthRecommendation {
  priority: string;
  message: string;
}

// --- Config (api-proveedor/utils/config) ---

export interface ProveedorConfig {
  frecuencia_scraping?: string | number;
  umbral_cambio_precio?: string | number;
  cache_ttl?: string | number;
  cache_aggressive?: boolean;
  parallel_processing?: boolean;
  ultima_actualizacion?: string;
  [key: string]: unknown;
}

export interface ConfigAnalysis {
  score: number;
  issues: string[];
  needsUpdate: boolean;
  optimizationPotential: number;
}

export interface OptimizationSuggestion {
  type: string;
  title: string;
  description: string;
}

// --- Reportes automáticos row shapes ---

export interface StockReporteRow {
  cantidad_actual: number;
  stock_minimo: number;
  [key: string]: unknown;
}

export interface MovimientoReporteRow {
  tipo_movimiento: string;
  cantidad: number;
  [key: string]: unknown;
}

export interface TareaReporteRow {
  estado: string;
  prioridad: string;
  fecha_vencimiento?: string | null;
  fecha_completada?: string | null;
  [key: string]: unknown;
}

export interface PrecioReporteRow {
  cambio_porcentaje?: number | null;
  [key: string]: unknown;
}

export interface FaltanteReporteRow {
  proveedor_asignado_id?: string | null;
  [key: string]: unknown;
}

// --- Cron Dashboard actions ---

export interface JobControlResult {
  success: boolean;
  message: string;
}
