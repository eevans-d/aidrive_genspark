/**
 * Shared module: Audit trail for sensitive operations
 * 
 * Records sensitive actions to audit_log table:
 * - Price changes
 * - Stock adjustments
 * - Product deletions
 * - Permission changes
 * - Data exports
 * 
 * Usage:
 * ```ts
 * import { auditLog, AuditAction } from '../_shared/audit.ts'
 * 
 * await auditLog({
 *   action: 'precio_actualizado',
 *   usuario_id: userId,
 *   entidad_tipo: 'productos',
 *   entidad_id: productId,
 *   detalles: { precio_anterior: 100, precio_nuevo: 150 },
 *   ip_address: req.headers.get('x-forwarded-for'),
 *   user_agent: req.headers.get('user-agent')
 * })
 * ```
 */

import { createLogger } from './logger.ts'
import type { SupabaseClient } from '@supabase/supabase-js'

const logger = createLogger('audit');

/**
 * Standard audit actions for consistency
 */
export type AuditAction =
  | 'precio_actualizado'
  | 'stock_ajustado'
  | 'producto_eliminado'
  | 'producto_creado'
  | 'movimiento_registrado'
  | 'usuario_modificado'
  | 'exportacion_datos'
  | 'login_fallido'
  | 'configuracion_modificada'
  | 'permiso_otorgado'
  | 'permiso_revocado'

export interface AuditLogEntry {
  action: AuditAction | string // Allow custom actions
  usuario_id?: string
  entidad_tipo?: string // 'productos', 'stock_deposito', 'usuarios', etc.
  entidad_id?: string
  detalles?: Record<string, unknown> // JSON details
  ip_address?: string | null
  user_agent?: string | null
  nivel?: 'info' | 'warning' | 'critical' // Default: info
}

export interface AuditLogResult {
  success: boolean
  audit_id?: string
  error?: string
}

/**
 * Log an audit entry to the database
 * 
 * In dry-run mode (no credentials), logs to console only.
 * In production, inserts into audit_log table.
 * 
 * @param supabase - Supabase client (optional in dry-run)
 * @param entry - Audit log entry data
 * @returns Promise with result
 */
export async function auditLog(
  supabase: SupabaseClient | null,
  entry: AuditLogEntry
): Promise<AuditLogResult> {
  const timestamp = new Date().toISOString()
  const nivel = entry.nivel || 'info'

  // Log to application logger
  logger.audit(entry.action, {
    usuario_id: entry.usuario_id,
    entidad_tipo: entry.entidad_tipo,
    entidad_id: entry.entidad_id,
    detalles: entry.detalles,
    ip: entry.ip_address,
    nivel
  })

  // Dry-run mode: no database
  if (!supabase) {
    logger.warn('Audit log: dry-run mode, no database insert')
    return { success: true, audit_id: `dry-run-${Date.now()}` }
  }

  // Insert into audit_log table
  try {
    const { data, error } = await supabase
      .from('audit_log')
      .insert({
        action: entry.action,
        usuario_id: entry.usuario_id,
        entidad_tipo: entry.entidad_tipo,
        entidad_id: entry.entidad_id,
        detalles: entry.detalles || {},
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        nivel,
        fecha_accion: timestamp
      })
      .select('id')
      .single()

    if (error) {
      logger.error('Error inserting audit log', { error })
      return { success: false, error: error.message }
    }

    logger.debug('Audit log inserted', { audit_id: data?.id })
    return { success: true, audit_id: data?.id }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Exception in auditLog', { error: errorMsg })
    return { success: false, error: errorMsg }
  }
}

/**
 * Query audit logs with filters
 * 
 * @param supabase - Supabase client
 * @param filters - Optional filters
 * @returns Promise with audit logs
 */
export async function queryAuditLogs(
  supabase: SupabaseClient,
  filters?: {
    action?: string
    usuario_id?: string
    entidad_tipo?: string
    fecha_desde?: string
    fecha_hasta?: string
    nivel?: string
    limit?: number
  }
) {
  try {
    let query = supabase
      .from('audit_log')
      .select('*')
      .order('fecha_accion', { ascending: false })

    if (filters?.action) {
      query = query.eq('action', filters.action)
    }
    if (filters?.usuario_id) {
      query = query.eq('usuario_id', filters.usuario_id)
    }
    if (filters?.entidad_tipo) {
      query = query.eq('entidad_tipo', filters.entidad_tipo)
    }
    if (filters?.nivel) {
      query = query.eq('nivel', filters.nivel)
    }
    if (filters?.fecha_desde) {
      query = query.gte('fecha_accion', filters.fecha_desde)
    }
    if (filters?.fecha_hasta) {
      query = query.lte('fecha_accion', filters.fecha_hasta)
    }
    if (filters?.limit) {
      query = query.limit(filters.limit)
    } else {
      query = query.limit(100) // Default limit
    }

    const { data, error } = await query

    if (error) {
      logger.error('Error querying audit logs', { error })
      return { success: false, error: error.message, data: [] }
    }

    return { success: true, data: data || [] }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    logger.error('Exception in queryAuditLogs', { error: errorMsg })
    return { success: false, error: errorMsg, data: [] }
  }
}

/**
 * Helper to extract client info from request
 */
export function extractAuditContext(req: Request): {
  ip_address: string | null
  user_agent: string | null
} {
  return {
    ip_address: req.headers.get('x-forwarded-for') || 
                 req.headers.get('x-real-ip') || 
                 null,
    user_agent: req.headers.get('user-agent') || null
  }
}
