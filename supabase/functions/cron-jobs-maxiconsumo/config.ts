/**
 * Configuración de jobs para cron-jobs-maxiconsumo
 * @module cron-jobs-maxiconsumo/config
 */

import type { CronJobConfig } from './types.ts';

export const JOB_CONFIGS: Record<string, CronJobConfig> = {
  'daily_price_update': {
    jobId: 'daily_price_update',
    name: 'Actualización Diaria de Precios Maxiconsumo',
    type: 'diario',
    cronExpression: '0 2 * * *',
    priority: 5,
    timeoutMs: 300000,
    maxRetries: 3,
    circuitBreakerThreshold: 5,
    active: true,
    parameters: {
      categories: ['almacen', 'bebidas', 'limpieza', 'congelados'],
      maxProducts: 5000,
      changeThreshold: 2.0,
      batchSize: 50
    },
    notificationChannels: ['email', 'slack']
  },
  'weekly_trend_analysis': {
    jobId: 'weekly_trend_analysis',
    name: 'Análisis Semanal de Tendencias',
    type: 'semanal',
    cronExpression: '0 3 * * 0',
    priority: 3,
    timeoutMs: 600000,
    maxRetries: 2,
    circuitBreakerThreshold: 3,
    active: true,
    parameters: {
      analysisPeriod: 'last_week',
      includeForecasting: true,
      exportExcel: true,
      batchSize: 500,
      maxRows: 50000,
    },
    notificationChannels: ['email']
  },
  'realtime_change_alerts': {
    jobId: 'realtime_change_alerts',
    name: 'Alertas en Tiempo Real',
    type: 'tiempo_real',
    cronExpression: '*/15 * * * *',
    priority: 5,
    timeoutMs: 120000,
    maxRetries: 2,
    circuitBreakerThreshold: 10,
    active: true,
    parameters: {
      criticalChangeThreshold: 15.0,
      highChangeThreshold: 10.0,
      instantAlerts: true
    },
    notificationChannels: ['email', 'sms', 'slack']
  },
  'maintenance_cleanup': {
    jobId: 'maintenance_cleanup',
    name: 'Mantenimiento del Sistema',
    type: 'semanal',
    cronExpression: '0 1 * * 1',
    priority: 2,
    timeoutMs: 900000,
    maxRetries: 1,
    circuitBreakerThreshold: 2,
    active: true,
    parameters: {
      cleanOldLogs: true,
      daysToKeepLogs: 30,
      daysToKeepMetrics: 90
    },
    notificationChannels: ['email']
  }
};

export function getJobConfig(jobId: string): CronJobConfig | undefined {
  return JOB_CONFIGS[jobId];
}

export function getAllJobConfigs(): CronJobConfig[] {
  return Object.values(JOB_CONFIGS);
}

export function getActiveJobs(): CronJobConfig[] {
  return getAllJobConfigs().filter(j => j.active);
}
