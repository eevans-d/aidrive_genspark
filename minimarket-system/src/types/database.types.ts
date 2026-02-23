export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      alertas_cambios_precios: {
        Row: {
          accion_recomendada: string | null
          created_at: string | null
          fecha_alerta: string | null
          id: string
          mensaje: string | null
          nombre_producto: string | null
          porcentaje_cambio: number | null
          procesada: boolean | null
          producto_id: string | null
          severidad: string | null
          tipo_cambio: string | null
          valor_anterior: number | null
          valor_nuevo: number | null
        }
        Insert: {
          accion_recomendada?: string | null
          created_at?: string | null
          fecha_alerta?: string | null
          id?: string
          mensaje?: string | null
          nombre_producto?: string | null
          porcentaje_cambio?: number | null
          procesada?: boolean | null
          producto_id?: string | null
          severidad?: string | null
          tipo_cambio?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number | null
        }
        Update: {
          accion_recomendada?: string | null
          created_at?: string | null
          fecha_alerta?: string | null
          id?: string
          mensaje?: string | null
          nombre_producto?: string | null
          porcentaje_cambio?: number | null
          procesada?: boolean | null
          producto_id?: string | null
          severidad?: string | null
          tipo_cambio?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number | null
        }
        Relationships: []
      }
      bitacora_turnos: {
        Row: {
          created_at: string
          id: string
          nota: string
          usuario_email: string | null
          usuario_id: string
          usuario_nombre: string | null
          usuario_rol: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          nota: string
          usuario_email?: string | null
          usuario_id?: string
          usuario_nombre?: string | null
          usuario_rol?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nota?: string
          usuario_email?: string | null
          usuario_id?: string
          usuario_nombre?: string | null
          usuario_rol?: string | null
        }
        Relationships: []
      }
      cache_proveedor: {
        Row: {
          endpoint: string
          payload: Json
          ttl_seconds: number
          updated_at: string
        }
        Insert: {
          endpoint: string
          payload: Json
          ttl_seconds: number
          updated_at?: string
        }
        Update: {
          endpoint?: string
          payload?: Json
          ttl_seconds?: number
          updated_at?: string
        }
        Relationships: []
      }
      categorias: {
        Row: {
          activo: boolean | null
          codigo: string | null
          created_at: string | null
          descripcion: string | null
          id: string
          margen_maximo: number | null
          margen_minimo: number | null
          nivel: number | null
          nombre: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          margen_maximo?: number | null
          margen_minimo?: number | null
          nivel?: number | null
          nombre: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          codigo?: string | null
          created_at?: string | null
          descripcion?: string | null
          id?: string
          margen_maximo?: number | null
          margen_minimo?: number | null
          nivel?: number | null
          nombre?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      circuit_breaker_state: {
        Row: {
          breaker_key: string
          failure_count: number
          last_failure_at: string | null
          opened_at: string | null
          state: string
          success_count: number
          updated_at: string
        }
        Insert: {
          breaker_key: string
          failure_count?: number
          last_failure_at?: string | null
          opened_at?: string | null
          state?: string
          success_count?: number
          updated_at?: string
        }
        Update: {
          breaker_key?: string
          failure_count?: number
          last_failure_at?: string | null
          opened_at?: string | null
          state?: string
          success_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          activo: boolean | null
          created_at: string | null
          departamento: string | null
          direccion_default: string | null
          edificio: string | null
          email: string | null
          id: string
          limite_credito: number | null
          link_pago: string | null
          nombre: string
          observaciones: string | null
          piso: string | null
          telefono: string | null
          updated_at: string | null
          whatsapp_e164: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          departamento?: string | null
          direccion_default?: string | null
          edificio?: string | null
          email?: string | null
          id?: string
          limite_credito?: number | null
          link_pago?: string | null
          nombre: string
          observaciones?: string | null
          piso?: string | null
          telefono?: string | null
          updated_at?: string | null
          whatsapp_e164?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          departamento?: string | null
          direccion_default?: string | null
          edificio?: string | null
          email?: string | null
          id?: string
          limite_credito?: number | null
          link_pago?: string | null
          nombre?: string
          observaciones?: string | null
          piso?: string | null
          telefono?: string | null
          updated_at?: string | null
          whatsapp_e164?: string | null
        }
        Relationships: []
      }
      comparacion_precios: {
        Row: {
          created_at: string | null
          diferencia_absoluta: number | null
          diferencia_porcentual: number | null
          es_oportunidad_ahorro: boolean | null
          fecha_comparacion: string
          fuente: string | null
          id: string
          nombre_producto: string | null
          precio_actual: number | null
          precio_proveedor: number | null
          producto_id: string | null
          recomendacion: string | null
        }
        Insert: {
          created_at?: string | null
          diferencia_absoluta?: number | null
          diferencia_porcentual?: number | null
          es_oportunidad_ahorro?: boolean | null
          fecha_comparacion: string
          fuente?: string | null
          id?: string
          nombre_producto?: string | null
          precio_actual?: number | null
          precio_proveedor?: number | null
          producto_id?: string | null
          recomendacion?: string | null
        }
        Update: {
          created_at?: string | null
          diferencia_absoluta?: number | null
          diferencia_porcentual?: number | null
          es_oportunidad_ahorro?: boolean | null
          fecha_comparacion?: string
          fuente?: string | null
          id?: string
          nombre_producto?: string | null
          precio_actual?: number | null
          precio_proveedor?: number | null
          producto_id?: string | null
          recomendacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_comparacion_precios_producto"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion_proveedor: {
        Row: {
          activo: boolean | null
          configuraciones: Json | null
          created_at: string | null
          frecuencia_scraping: string | null
          id: string
          nombre: string
          proxima_sincronizacion: string | null
          ultima_sincronizacion: string | null
          umbral_cambio_precio: number | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          configuraciones?: Json | null
          created_at?: string | null
          frecuencia_scraping?: string | null
          id?: string
          nombre: string
          proxima_sincronizacion?: string | null
          ultima_sincronizacion?: string | null
          umbral_cambio_precio?: number | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          configuraciones?: Json | null
          created_at?: string | null
          frecuencia_scraping?: string | null
          id?: string
          nombre?: string
          proxima_sincronizacion?: string | null
          ultima_sincronizacion?: string | null
          umbral_cambio_precio?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_jobs_alerts: {
        Row: {
          accion_recomendada: string | null
          canales_notificacion: Json | null
          created_at: string | null
          descripcion: string | null
          estado_alerta: string | null
          execution_id: string | null
          fecha_envio: string | null
          fecha_resolucion: string | null
          id: string
          job_id: string
          severidad: string | null
          tipo_alerta: string | null
          titulo: string | null
        }
        Insert: {
          accion_recomendada?: string | null
          canales_notificacion?: Json | null
          created_at?: string | null
          descripcion?: string | null
          estado_alerta?: string | null
          execution_id?: string | null
          fecha_envio?: string | null
          fecha_resolucion?: string | null
          id?: string
          job_id: string
          severidad?: string | null
          tipo_alerta?: string | null
          titulo?: string | null
        }
        Update: {
          accion_recomendada?: string | null
          canales_notificacion?: Json | null
          created_at?: string | null
          descripcion?: string | null
          estado_alerta?: string | null
          execution_id?: string | null
          fecha_envio?: string | null
          fecha_resolucion?: string | null
          id?: string
          job_id?: string
          severidad?: string | null
          tipo_alerta?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      cron_jobs_config: {
        Row: {
          created_at: string | null
          cron_expression: string | null
          cron_job_name: string | null
          descripcion: string | null
          edge_function_name: string | null
          id: string
          is_active: boolean | null
          job_id: string
          parametros: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cron_expression?: string | null
          cron_job_name?: string | null
          descripcion?: string | null
          edge_function_name?: string | null
          id?: string
          is_active?: boolean | null
          job_id: string
          parametros?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cron_expression?: string | null
          cron_job_name?: string | null
          descripcion?: string | null
          edge_function_name?: string | null
          id?: string
          is_active?: boolean | null
          job_id?: string
          parametros?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_jobs_execution_log: {
        Row: {
          alertas_generadas: number | null
          created_at: string | null
          duracion_ms: number | null
          emails_enviados: number | null
          end_time: string | null
          error_message: string | null
          estado: string | null
          execution_id: string | null
          id: string
          job_id: string
          memory_usage_start: number | null
          parametros_ejecucion: Json | null
          productos_exitosos: number | null
          productos_fallidos: number | null
          productos_procesados: number | null
          request_id: string | null
          resultado: Json | null
          sms_enviados: number | null
          start_time: string | null
        }
        Insert: {
          alertas_generadas?: number | null
          created_at?: string | null
          duracion_ms?: number | null
          emails_enviados?: number | null
          end_time?: string | null
          error_message?: string | null
          estado?: string | null
          execution_id?: string | null
          id?: string
          job_id: string
          memory_usage_start?: number | null
          parametros_ejecucion?: Json | null
          productos_exitosos?: number | null
          productos_fallidos?: number | null
          productos_procesados?: number | null
          request_id?: string | null
          resultado?: Json | null
          sms_enviados?: number | null
          start_time?: string | null
        }
        Update: {
          alertas_generadas?: number | null
          created_at?: string | null
          duracion_ms?: number | null
          emails_enviados?: number | null
          end_time?: string | null
          error_message?: string | null
          estado?: string | null
          execution_id?: string | null
          id?: string
          job_id?: string
          memory_usage_start?: number | null
          parametros_ejecucion?: Json | null
          productos_exitosos?: number | null
          productos_fallidos?: number | null
          productos_procesados?: number | null
          request_id?: string | null
          resultado?: Json | null
          sms_enviados?: number | null
          start_time?: string | null
        }
        Relationships: []
      }
      cron_jobs_health_checks: {
        Row: {
          check_details: Json | null
          check_type: string | null
          created_at: string | null
          id: string
          job_id: string
          last_success: string | null
          response_time_ms: number | null
          status: string | null
        }
        Insert: {
          check_details?: Json | null
          check_type?: string | null
          created_at?: string | null
          id?: string
          job_id: string
          last_success?: string | null
          response_time_ms?: number | null
          status?: string | null
        }
        Update: {
          check_details?: Json | null
          check_type?: string | null
          created_at?: string | null
          id?: string
          job_id?: string
          last_success?: string | null
          response_time_ms?: number | null
          status?: string | null
        }
        Relationships: []
      }
      cron_jobs_locks: {
        Row: {
          job_id: string
          locked_by: string | null
          locked_until: string
          updated_at: string | null
        }
        Insert: {
          job_id: string
          locked_by?: string | null
          locked_until: string
          updated_at?: string | null
        }
        Update: {
          job_id?: string
          locked_by?: string | null
          locked_until?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      cron_jobs_metrics: {
        Row: {
          alertas_generadas_total: number | null
          created_at: string | null
          disponibilidad_porcentual: number | null
          ejecuciones_totales: number | null
          fecha_metricas: string
          id: string
          job_id: string | null
          tiempo_promedio_ms: number | null
        }
        Insert: {
          alertas_generadas_total?: number | null
          created_at?: string | null
          disponibilidad_porcentual?: number | null
          ejecuciones_totales?: number | null
          fecha_metricas: string
          id?: string
          job_id?: string | null
          tiempo_promedio_ms?: number | null
        }
        Update: {
          alertas_generadas_total?: number | null
          created_at?: string | null
          disponibilidad_porcentual?: number | null
          ejecuciones_totales?: number | null
          fecha_metricas?: string
          id?: string
          job_id?: string | null
          tiempo_promedio_ms?: number | null
        }
        Relationships: []
      }
      cron_jobs_monitoring_history: {
        Row: {
          active_jobs_count: number | null
          alerts_generated: number | null
          created_at: string | null
          details: Json | null
          health_score: number | null
          id: string
          memory_usage_percent: number | null
          response_time_ms: number | null
          success_rate: number | null
          timestamp: string
          uptime_percentage: number | null
        }
        Insert: {
          active_jobs_count?: number | null
          alerts_generated?: number | null
          created_at?: string | null
          details?: Json | null
          health_score?: number | null
          id?: string
          memory_usage_percent?: number | null
          response_time_ms?: number | null
          success_rate?: number | null
          timestamp: string
          uptime_percentage?: number | null
        }
        Update: {
          active_jobs_count?: number | null
          alerts_generated?: number | null
          created_at?: string | null
          details?: Json | null
          health_score?: number | null
          id?: string
          memory_usage_percent?: number | null
          response_time_ms?: number | null
          success_rate?: number | null
          timestamp?: string
          uptime_percentage?: number | null
        }
        Relationships: []
      }
      cron_jobs_notification_preferences: {
        Row: {
          channel_id: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          preferences: Json | null
          user_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          preferences?: Json | null
          user_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          preferences?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      cron_jobs_notifications: {
        Row: {
          channel_id: string | null
          created_at: string | null
          data: Json | null
          error_message: string | null
          id: string
          message_id: string | null
          priority: string | null
          recipients: Json | null
          sent_at: string | null
          source: string | null
          status: string | null
          template_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          priority?: string | null
          recipients?: Json | null
          sent_at?: string | null
          source?: string | null
          status?: string | null
          template_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          data?: Json | null
          error_message?: string | null
          id?: string
          message_id?: string | null
          priority?: string | null
          recipients?: Json | null
          sent_at?: string | null
          source?: string | null
          status?: string | null
          template_id?: string | null
        }
        Relationships: []
      }
      cron_jobs_tracking: {
        Row: {
          activo: boolean | null
          circuit_breaker_state: string | null
          created_at: string | null
          descripcion: string | null
          duracion_ejecucion_ms: number | null
          error_ultima_ejecucion: string | null
          estado_job: string | null
          id: string
          intentos_ejecucion: number | null
          job_id: string
          nombre_job: string | null
          proxima_ejecucion: string | null
          resultado_ultima_ejecucion: Json | null
          ultima_ejecucion: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          circuit_breaker_state?: string | null
          created_at?: string | null
          descripcion?: string | null
          duracion_ejecucion_ms?: number | null
          error_ultima_ejecucion?: string | null
          estado_job?: string | null
          id?: string
          intentos_ejecucion?: number | null
          job_id: string
          nombre_job?: string | null
          proxima_ejecucion?: string | null
          resultado_ultima_ejecucion?: Json | null
          ultima_ejecucion?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          circuit_breaker_state?: string | null
          created_at?: string | null
          descripcion?: string | null
          duracion_ejecucion_ms?: number | null
          error_ultima_ejecucion?: string | null
          estado_job?: string | null
          id?: string
          intentos_ejecucion?: number | null
          job_id?: string
          nombre_job?: string | null
          proxima_ejecucion?: string | null
          resultado_ultima_ejecucion?: Json | null
          ultima_ejecucion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      cuentas_corrientes_movimientos: {
        Row: {
          cliente_id: string
          created_at: string | null
          descripcion: string | null
          id: string
          monto: number
          tipo: string
          usuario_id: string
          venta_id: string | null
        }
        Insert: {
          cliente_id: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          monto: number
          tipo: string
          usuario_id: string
          venta_id?: string | null
        }
        Update: {
          cliente_id?: string
          created_at?: string | null
          descripcion?: string | null
          id?: string
          monto?: number
          tipo?: string
          usuario_id?: string
          venta_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cuentas_corrientes_movimientos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cuentas_corrientes_movimientos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_cc_saldos_por_cliente"
            referencedColumns: ["cliente_id"]
          },
          {
            foreignKeyName: "cuentas_corrientes_movimientos_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_pedidos: {
        Row: {
          cantidad: number
          created_at: string | null
          fecha_preparado: string | null
          id: string
          observaciones: string | null
          pedido_id: string
          precio_unitario: number
          preparado: boolean | null
          preparado_por_id: string | null
          producto_id: string | null
          producto_nombre: string
          producto_sku: string | null
          subtotal: number | null
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          fecha_preparado?: string | null
          id?: string
          observaciones?: string | null
          pedido_id: string
          precio_unitario: number
          preparado?: boolean | null
          preparado_por_id?: string | null
          producto_id?: string | null
          producto_nombre: string
          producto_sku?: string | null
          subtotal?: number | null
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          fecha_preparado?: string | null
          id?: string
          observaciones?: string | null
          pedido_id?: string
          precio_unitario?: number
          preparado?: boolean | null
          preparado_por_id?: string | null
          producto_id?: string | null
          producto_nombre?: string
          producto_sku?: string | null
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalle_pedidos_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_pedidos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      estadisticas_scraping: {
        Row: {
          categoria: string | null
          comparaciones_realizadas: number | null
          created_at: string | null
          detalle: Json | null
          duracion_ms: number | null
          errores: number | null
          fuente: string | null
          granularidad: string | null
          id: string
          productos_actualizados: number | null
          productos_fallidos: number | null
          productos_nuevos: number | null
          productos_totales: number | null
        }
        Insert: {
          categoria?: string | null
          comparaciones_realizadas?: number | null
          created_at?: string | null
          detalle?: Json | null
          duracion_ms?: number | null
          errores?: number | null
          fuente?: string | null
          granularidad?: string | null
          id?: string
          productos_actualizados?: number | null
          productos_fallidos?: number | null
          productos_nuevos?: number | null
          productos_totales?: number | null
        }
        Update: {
          categoria?: string | null
          comparaciones_realizadas?: number | null
          created_at?: string | null
          detalle?: Json | null
          duracion_ms?: number | null
          errores?: number | null
          fuente?: string | null
          granularidad?: string | null
          id?: string
          productos_actualizados?: number | null
          productos_fallidos?: number | null
          productos_nuevos?: number | null
          productos_totales?: number | null
        }
        Relationships: []
      }
      facturas_ingesta: {
        Row: {
          created_at: string | null
          created_by: string | null
          datos_extraidos: Json | null
          estado: string
          fecha_factura: string | null
          id: string
          imagen_url: string | null
          numero: string | null
          proveedor_id: string
          request_id: string | null
          score_confianza: number | null
          tipo_comprobante: string
          total: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          datos_extraidos?: Json | null
          estado?: string
          fecha_factura?: string | null
          id?: string
          imagen_url?: string | null
          numero?: string | null
          proveedor_id: string
          request_id?: string | null
          score_confianza?: number | null
          tipo_comprobante?: string
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          datos_extraidos?: Json | null
          estado?: string
          fecha_factura?: string | null
          id?: string
          imagen_url?: string | null
          numero?: string | null
          proveedor_id?: string
          request_id?: string | null
          score_confianza?: number | null
          tipo_comprobante?: string
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facturas_ingesta_proveedor_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas_ingesta_eventos: {
        Row: {
          created_at: string | null
          datos: Json | null
          evento: string
          factura_id: string
          id: string
          usuario_id: string | null
        }
        Insert: {
          created_at?: string | null
          datos?: Json | null
          evento: string
          factura_id: string
          id?: string
          usuario_id?: string | null
        }
        Update: {
          created_at?: string | null
          datos?: Json | null
          evento?: string
          factura_id?: string
          id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_eventos_factura_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas_ingesta"
            referencedColumns: ["id"]
          },
        ]
      }
      facturas_ingesta_items: {
        Row: {
          alias_usado: string | null
          cantidad: number
          confianza_match: number | null
          created_at: string | null
          descripcion_original: string
          estado_match: string
          factura_id: string
          id: string
          precio_unitario: number | null
          producto_id: string | null
          subtotal: number | null
          unidad: string | null
        }
        Insert: {
          alias_usado?: string | null
          cantidad?: number
          confianza_match?: number | null
          created_at?: string | null
          descripcion_original: string
          estado_match?: string
          factura_id: string
          id?: string
          precio_unitario?: number | null
          producto_id?: string | null
          subtotal?: number | null
          unidad?: string | null
        }
        Update: {
          alias_usado?: string | null
          cantidad?: number
          confianza_match?: number | null
          created_at?: string | null
          descripcion_original?: string
          estado_match?: string
          factura_id?: string
          id?: string
          precio_unitario?: number | null
          producto_id?: string | null
          subtotal?: number | null
          unidad?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fi_items_factura_fkey"
            columns: ["factura_id"]
            isOneToOne: false
            referencedRelation: "facturas_ingesta"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fi_items_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_deposito: {
        Row: {
          cantidad: number
          cantidad_anterior: number | null
          cantidad_nueva: number | null
          created_at: string | null
          fecha_movimiento: string | null
          id: string
          motivo: string | null
          observaciones: string | null
          producto_id: string | null
          proveedor_id: string | null
          tipo_movimiento: string
          usuario_id: string | null
        }
        Insert: {
          cantidad: number
          cantidad_anterior?: number | null
          cantidad_nueva?: number | null
          created_at?: string | null
          fecha_movimiento?: string | null
          id?: string
          motivo?: string | null
          observaciones?: string | null
          producto_id?: string | null
          proveedor_id?: string | null
          tipo_movimiento: string
          usuario_id?: string | null
        }
        Update: {
          cantidad?: number
          cantidad_anterior?: number | null
          cantidad_nueva?: number | null
          created_at?: string | null
          fecha_movimiento?: string | null
          id?: string
          motivo?: string | null
          observaciones?: string | null
          producto_id?: string | null
          proveedor_id?: string | null
          tipo_movimiento?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_deposito_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_deposito_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      notificaciones_tareas: {
        Row: {
          created_at: string | null
          fecha_envio: string | null
          id: string
          leido: boolean | null
          mensaje: string | null
          tarea_id: string | null
          tipo: string | null
          updated_at: string | null
          usuario_destino_id: string | null
          usuario_destino_nombre: string | null
        }
        Insert: {
          created_at?: string | null
          fecha_envio?: string | null
          id?: string
          leido?: boolean | null
          mensaje?: string | null
          tarea_id?: string | null
          tipo?: string | null
          updated_at?: string | null
          usuario_destino_id?: string | null
          usuario_destino_nombre?: string | null
        }
        Update: {
          created_at?: string | null
          fecha_envio?: string | null
          id?: string
          leido?: boolean | null
          mensaje?: string | null
          tarea_id?: string | null
          tipo?: string | null
          updated_at?: string | null
          usuario_destino_id?: string | null
          usuario_destino_nombre?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notificaciones_tareas_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas_metricas"
            referencedColumns: ["tarea_id"]
          },
          {
            foreignKeyName: "notificaciones_tareas_tarea_id_fkey"
            columns: ["tarea_id"]
            isOneToOne: false
            referencedRelation: "tareas_pendientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ofertas_stock: {
        Row: {
          activa: boolean
          created_at: string | null
          created_by: string | null
          deactivated_at: string | null
          deactivated_by: string | null
          descuento_pct: number
          id: string
          precio_oferta: number
          stock_id: string
          updated_at: string | null
        }
        Insert: {
          activa?: boolean
          created_at?: string | null
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          descuento_pct: number
          id?: string
          precio_oferta: number
          stock_id: string
          updated_at?: string | null
        }
        Update: {
          activa?: boolean
          created_at?: string | null
          created_by?: string | null
          deactivated_at?: string | null
          deactivated_by?: string | null
          descuento_pct?: number
          id?: string
          precio_oferta?: number
          stock_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ofertas_stock_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "mv_productos_proximos_vencer"
            referencedColumns: ["stock_id"]
          },
          {
            foreignKeyName: "ofertas_stock_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "mv_stock_bajo"
            referencedColumns: ["stock_id"]
          },
          {
            foreignKeyName: "ofertas_stock_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stock_deposito"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ofertas_stock_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "vista_ofertas_sugeridas"
            referencedColumns: ["stock_id"]
          },
        ]
      }
      ordenes_compra: {
        Row: {
          cantidad: number
          cantidad_recibida: number | null
          created_at: string | null
          estado: string | null
          fecha_creacion: string | null
          fecha_estimada: string | null
          id: string
          producto_id: string
          proveedor_id: string | null
          updated_at: string | null
        }
        Insert: {
          cantidad: number
          cantidad_recibida?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_creacion?: string | null
          fecha_estimada?: string | null
          id?: string
          producto_id: string
          proveedor_id?: string | null
          updated_at?: string | null
        }
        Update: {
          cantidad?: number
          cantidad_recibida?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_creacion?: string | null
          fecha_estimada?: string | null
          id?: string
          producto_id?: string
          proveedor_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ordenes_compra_producto"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ordenes_compra_proveedor"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          audio_url: string | null
          cliente_id: string | null
          cliente_nombre: string
          cliente_telefono: string | null
          creado_por_id: string | null
          created_at: string | null
          departamento: string | null
          direccion_entrega: string | null
          edificio: string | null
          entregado_por_id: string | null
          estado: string
          estado_pago: string
          fecha_entrega_estimada: string | null
          fecha_entregado: string | null
          fecha_pedido: string | null
          fecha_preparado: string | null
          horario_entrega_preferido: string | null
          id: string
          monto_pagado: number | null
          monto_total: number | null
          numero_pedido: number
          observaciones: string | null
          observaciones_internas: string | null
          piso: string | null
          preparado_por_id: string | null
          tipo_entrega: string
          transcripcion_texto: string | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          cliente_id?: string | null
          cliente_nombre: string
          cliente_telefono?: string | null
          creado_por_id?: string | null
          created_at?: string | null
          departamento?: string | null
          direccion_entrega?: string | null
          edificio?: string | null
          entregado_por_id?: string | null
          estado?: string
          estado_pago?: string
          fecha_entrega_estimada?: string | null
          fecha_entregado?: string | null
          fecha_pedido?: string | null
          fecha_preparado?: string | null
          horario_entrega_preferido?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_pedido?: number
          observaciones?: string | null
          observaciones_internas?: string | null
          piso?: string | null
          preparado_por_id?: string | null
          tipo_entrega?: string
          transcripcion_texto?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          cliente_id?: string | null
          cliente_nombre?: string
          cliente_telefono?: string | null
          creado_por_id?: string | null
          created_at?: string | null
          departamento?: string | null
          direccion_entrega?: string | null
          edificio?: string | null
          entregado_por_id?: string | null
          estado?: string
          estado_pago?: string
          fecha_entrega_estimada?: string | null
          fecha_entregado?: string | null
          fecha_pedido?: string | null
          fecha_preparado?: string | null
          horario_entrega_preferido?: string | null
          id?: string
          monto_pagado?: number | null
          monto_total?: number | null
          numero_pedido?: number
          observaciones?: string | null
          observaciones_internas?: string | null
          piso?: string | null
          preparado_por_id?: string | null
          tipo_entrega?: string
          transcripcion_texto?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_cc_saldos_por_cliente"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
      personal: {
        Row: {
          activo: boolean | null
          created_at: string | null
          departamento: string | null
          direccion: string | null
          email: string | null
          fecha_ingreso: string | null
          id: string
          nombre: string
          rol: string | null
          telefono: string | null
          updated_at: string | null
          user_auth_id: string | null
        }
        Insert: {
          activo?: boolean | null
          created_at?: string | null
          departamento?: string | null
          direccion?: string | null
          email?: string | null
          fecha_ingreso?: string | null
          id?: string
          nombre: string
          rol?: string | null
          telefono?: string | null
          updated_at?: string | null
          user_auth_id?: string | null
        }
        Update: {
          activo?: boolean | null
          created_at?: string | null
          departamento?: string | null
          direccion?: string | null
          email?: string | null
          fecha_ingreso?: string | null
          id?: string
          nombre?: string
          rol?: string | null
          telefono?: string | null
          updated_at?: string | null
          user_auth_id?: string | null
        }
        Relationships: []
      }
      precios_compra: {
        Row: {
          created_at: string | null
          created_by: string | null
          factura_ingesta_item_id: string | null
          id: string
          origen: string
          precio_unitario: number
          producto_id: string
          proveedor_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          factura_ingesta_item_id?: string | null
          id?: string
          origen?: string
          precio_unitario: number
          producto_id: string
          proveedor_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          factura_ingesta_item_id?: string | null
          id?: string
          origen?: string
          precio_unitario?: number
          producto_id?: string
          proveedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pc_factura_item_fkey"
            columns: ["factura_ingesta_item_id"]
            isOneToOne: false
            referencedRelation: "facturas_ingesta_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pc_proveedor_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      precios_historicos: {
        Row: {
          cambio_porcentaje: number | null
          created_at: string | null
          fecha: string | null
          fecha_cambio: string | null
          id: string
          motivo_cambio: string | null
          precio_anterior: number | null
          precio_nuevo: number | null
          producto_id: string | null
          usuario_id: string | null
        }
        Insert: {
          cambio_porcentaje?: number | null
          created_at?: string | null
          fecha?: string | null
          fecha_cambio?: string | null
          id?: string
          motivo_cambio?: string | null
          precio_anterior?: number | null
          precio_nuevo?: number | null
          producto_id?: string | null
          usuario_id?: string | null
        }
        Update: {
          cambio_porcentaje?: number | null
          created_at?: string | null
          fecha?: string | null
          fecha_cambio?: string | null
          id?: string
          motivo_cambio?: string | null
          precio_anterior?: number | null
          precio_nuevo?: number | null
          producto_id?: string | null
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "precios_historicos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      precios_proveedor: {
        Row: {
          activo: boolean | null
          categoria: string | null
          codigo_barras: string | null
          created_at: string | null
          descripcion: string | null
          fuente: string | null
          hash_contenido: string | null
          id: string
          imagen_url: string | null
          marca: string | null
          metadata: Json | null
          nombre: string | null
          precio_actual: number | null
          precio_anterior: number | null
          precio_promocional: number | null
          precio_unitario: number | null
          score_confiabilidad: number | null
          sku: string
          stock_disponible: number | null
          stock_nivel_minimo: number | null
          ultima_actualizacion: string | null
          updated_at: string | null
          url_producto: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descripcion?: string | null
          fuente?: string | null
          hash_contenido?: string | null
          id?: string
          imagen_url?: string | null
          marca?: string | null
          metadata?: Json | null
          nombre?: string | null
          precio_actual?: number | null
          precio_anterior?: number | null
          precio_promocional?: number | null
          precio_unitario?: number | null
          score_confiabilidad?: number | null
          sku: string
          stock_disponible?: number | null
          stock_nivel_minimo?: number | null
          ultima_actualizacion?: string | null
          updated_at?: string | null
          url_producto?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          codigo_barras?: string | null
          created_at?: string | null
          descripcion?: string | null
          fuente?: string | null
          hash_contenido?: string | null
          id?: string
          imagen_url?: string | null
          marca?: string | null
          metadata?: Json | null
          nombre?: string | null
          precio_actual?: number | null
          precio_anterior?: number | null
          precio_promocional?: number | null
          precio_unitario?: number | null
          score_confiabilidad?: number | null
          sku?: string
          stock_disponible?: number | null
          stock_nivel_minimo?: number | null
          ultima_actualizacion?: string | null
          updated_at?: string | null
          url_producto?: string | null
        }
        Relationships: []
      }
      producto_aliases: {
        Row: {
          activo: boolean
          alias_normalizado: string
          alias_texto: string
          confianza: string
          created_at: string | null
          created_by: string | null
          id: string
          origen: string | null
          producto_id: string
          proveedor_id: string | null
        }
        Insert: {
          activo?: boolean
          alias_normalizado?: string
          alias_texto: string
          confianza?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          origen?: string | null
          producto_id: string
          proveedor_id?: string | null
        }
        Update: {
          activo?: boolean
          alias_normalizado?: string
          alias_texto?: string
          confianza?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          origen?: string | null
          producto_id?: string
          proveedor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pa_producto_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pa_proveedor_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          categoria: string | null
          categoria_id: string | null
          codigo_barras: string | null
          contenido_neto: string | null
          created_at: string | null
          created_by: string | null
          descripcion: string | null
          dimensiones: Json | null
          id: string
          marca: string | null
          margen_ganancia: number | null
          nombre: string
          observaciones: string | null
          precio_actual: number
          precio_costo: number | null
          precio_sugerido: number | null
          proveedor_principal_id: string | null
          sku: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          activo?: boolean | null
          categoria?: string | null
          categoria_id?: string | null
          codigo_barras?: string | null
          contenido_neto?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          dimensiones?: Json | null
          id?: string
          marca?: string | null
          margen_ganancia?: number | null
          nombre: string
          observaciones?: string | null
          precio_actual?: number
          precio_costo?: number | null
          precio_sugerido?: number | null
          proveedor_principal_id?: string | null
          sku?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          activo?: boolean | null
          categoria?: string | null
          categoria_id?: string | null
          codigo_barras?: string | null
          contenido_neto?: string | null
          created_at?: string | null
          created_by?: string | null
          descripcion?: string | null
          dimensiones?: Json | null
          id?: string
          marca?: string | null
          margen_ganancia?: number | null
          nombre?: string
          observaciones?: string | null
          precio_actual?: number
          precio_costo?: number | null
          precio_sugerido?: number | null
          proveedor_principal_id?: string | null
          sku?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_proveedor_principal_id_fkey"
            columns: ["proveedor_principal_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      productos_faltantes: {
        Row: {
          cantidad_faltante: number | null
          cantidad_pedida: number | null
          created_at: string | null
          estado: string | null
          fecha_deteccion: string | null
          fecha_reporte: string | null
          fecha_resolucion: string | null
          id: string
          observaciones: string | null
          precio_estimado: number | null
          prioridad: string | null
          producto_id: string | null
          producto_nombre: string | null
          proveedor_asignado_id: string | null
          reportado_por_id: string | null
          reportado_por_nombre: string | null
          resuelto: boolean | null
          updated_at: string | null
        }
        Insert: {
          cantidad_faltante?: number | null
          cantidad_pedida?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_deteccion?: string | null
          fecha_reporte?: string | null
          fecha_resolucion?: string | null
          id?: string
          observaciones?: string | null
          precio_estimado?: number | null
          prioridad?: string | null
          producto_id?: string | null
          producto_nombre?: string | null
          proveedor_asignado_id?: string | null
          reportado_por_id?: string | null
          reportado_por_nombre?: string | null
          resuelto?: boolean | null
          updated_at?: string | null
        }
        Update: {
          cantidad_faltante?: number | null
          cantidad_pedida?: number | null
          created_at?: string | null
          estado?: string | null
          fecha_deteccion?: string | null
          fecha_reporte?: string | null
          fecha_resolucion?: string | null
          id?: string
          observaciones?: string | null
          precio_estimado?: number | null
          prioridad?: string | null
          producto_id?: string | null
          producto_nombre?: string | null
          proveedor_asignado_id?: string | null
          reportado_por_id?: string | null
          reportado_por_nombre?: string | null
          resuelto?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_faltantes_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_faltantes_proveedor_id_fkey"
            columns: ["proveedor_asignado_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          activo: boolean | null
          contacto: string | null
          created_at: string | null
          cuit: string | null
          direccion: string | null
          email: string | null
          id: string
          nombre: string
          productos_ofrecidos: string[] | null
          sitio_web: string | null
          telefono: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          contacto?: string | null
          created_at?: string | null
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre: string
          productos_ofrecidos?: string[] | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          contacto?: string | null
          created_at?: string | null
          cuit?: string | null
          direccion?: string | null
          email?: string | null
          id?: string
          nombre?: string
          productos_ofrecidos?: string[] | null
          sitio_web?: string | null
          telefono?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rate_limit_state: {
        Row: {
          count: number
          key: string
          updated_at: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      stock_deposito: {
        Row: {
          cantidad_actual: number | null
          created_at: string | null
          fecha_vencimiento: string | null
          id: string
          lote: string | null
          producto_id: string | null
          stock_maximo: number | null
          stock_minimo: number | null
          ubicacion: string | null
          updated_at: string | null
        }
        Insert: {
          cantidad_actual?: number | null
          created_at?: string | null
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          producto_id?: string | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Update: {
          cantidad_actual?: number | null
          created_at?: string | null
          fecha_vencimiento?: string | null
          id?: string
          lote?: string | null
          producto_id?: string | null
          stock_maximo?: number | null
          stock_minimo?: number | null
          ubicacion?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_deposito_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservado: {
        Row: {
          cantidad: number
          created_at: string | null
          estado: string | null
          fecha_cancelacion: string | null
          fecha_reserva: string | null
          id: string
          idempotency_key: string | null
          producto_id: string
          referencia: string | null
          usuario: string | null
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          estado?: string | null
          fecha_cancelacion?: string | null
          fecha_reserva?: string | null
          id?: string
          idempotency_key?: string | null
          producto_id: string
          referencia?: string | null
          usuario?: string | null
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          estado?: string | null
          fecha_cancelacion?: string | null
          fecha_reserva?: string | null
          id?: string
          idempotency_key?: string | null
          producto_id?: string
          referencia?: string | null
          usuario?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_stock_reservado_producto"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_pendientes: {
        Row: {
          asignada_a_id: string | null
          asignada_a_nombre: string | null
          asignado_a_id: string | null
          cancelada_por_id: string | null
          cancelada_por_nombre: string | null
          completada_por_id: string | null
          completada_por_nombre: string | null
          completado_por_id: string | null
          creada_por_id: string | null
          creada_por_nombre: string | null
          created_at: string | null
          datos: Json | null
          descripcion: string | null
          estado: string | null
          fecha_cancelada: string | null
          fecha_completada: string | null
          fecha_completado: string | null
          fecha_creacion: string | null
          fecha_vencimiento: string | null
          id: string
          prioridad: string | null
          razon_cancelacion: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
        }
        Insert: {
          asignada_a_id?: string | null
          asignada_a_nombre?: string | null
          asignado_a_id?: string | null
          cancelada_por_id?: string | null
          cancelada_por_nombre?: string | null
          completada_por_id?: string | null
          completada_por_nombre?: string | null
          completado_por_id?: string | null
          creada_por_id?: string | null
          creada_por_nombre?: string | null
          created_at?: string | null
          datos?: Json | null
          descripcion?: string | null
          estado?: string | null
          fecha_cancelada?: string | null
          fecha_completada?: string | null
          fecha_completado?: string | null
          fecha_creacion?: string | null
          fecha_vencimiento?: string | null
          id?: string
          prioridad?: string | null
          razon_cancelacion?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
        }
        Update: {
          asignada_a_id?: string | null
          asignada_a_nombre?: string | null
          asignado_a_id?: string | null
          cancelada_por_id?: string | null
          cancelada_por_nombre?: string | null
          completada_por_id?: string | null
          completada_por_nombre?: string | null
          completado_por_id?: string | null
          creada_por_id?: string | null
          creada_por_nombre?: string | null
          created_at?: string | null
          datos?: Json | null
          descripcion?: string | null
          estado?: string | null
          fecha_cancelada?: string | null
          fecha_completada?: string | null
          fecha_completado?: string | null
          fecha_creacion?: string | null
          fecha_vencimiento?: string | null
          id?: string
          prioridad?: string | null
          razon_cancelacion?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      venta_items: {
        Row: {
          cantidad: number
          created_at: string | null
          id: string
          precio_unitario: number
          producto_id: string
          producto_nombre_snapshot: string
          producto_sku_snapshot: string | null
          subtotal: number
          venta_id: string
        }
        Insert: {
          cantidad: number
          created_at?: string | null
          id?: string
          precio_unitario: number
          producto_id: string
          producto_nombre_snapshot: string
          producto_sku_snapshot?: string | null
          subtotal: number
          venta_id: string
        }
        Update: {
          cantidad?: number
          created_at?: string | null
          id?: string
          precio_unitario?: number
          producto_id?: string
          producto_nombre_snapshot?: string
          producto_sku_snapshot?: string | null
          subtotal?: number
          venta_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venta_items_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venta_items_venta_id_fkey"
            columns: ["venta_id"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          cliente_id: string | null
          created_at: string | null
          id: string
          idempotency_key: string
          metodo_pago: string
          monto_total: number
          updated_at: string | null
          usuario_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          idempotency_key: string
          metodo_pago: string
          monto_total: number
          updated_at?: string | null
          usuario_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string | null
          id?: string
          idempotency_key?: string
          metodo_pago?: string
          monto_total?: number
          updated_at?: string | null
          usuario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "vista_cc_saldos_por_cliente"
            referencedColumns: ["cliente_id"]
          },
        ]
      }
    }
    Views: {
      mv_productos_proximos_vencer: {
        Row: {
          cantidad_actual: number | null
          codigo_barras: string | null
          dias_hasta_vencimiento: number | null
          fecha_vencimiento: string | null
          lote: string | null
          nivel_alerta: string | null
          producto_id: string | null
          producto_nombre: string | null
          sku: string | null
          stock_id: string | null
          ubicacion: string | null
          ultima_actualizacion: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_deposito_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      mv_stock_bajo: {
        Row: {
          cantidad_actual: number | null
          categoria_id: string | null
          categoria_nombre: string | null
          codigo_barras: string | null
          nivel_stock: string | null
          porcentaje_stock_minimo: number | null
          producto_id: string | null
          producto_nombre: string | null
          sku: string | null
          stock_id: string | null
          stock_maximo: number | null
          stock_minimo: number | null
          ubicacion: string | null
          ultima_actualizacion: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_deposito_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      tareas_metricas: {
        Row: {
          asignado_a_id: string | null
          completado_por_id: string | null
          cumplimiento_sla: boolean | null
          dias_atraso: number | null
          estado: string | null
          fecha_completado: string | null
          fecha_creacion: string | null
          fecha_vencimiento: string | null
          tarea_id: string | null
          tiempo_resolucion: number | null
        }
        Relationships: []
      }
      vista_alertas_activas: {
        Row: {
          accion_recomendada: string | null
          created_at: string | null
          fecha_alerta: string | null
          id: string | null
          mensaje: string | null
          nombre_producto: string | null
          porcentaje_cambio: number | null
          procesada: boolean | null
          producto_id: string | null
          severidad: string | null
          tipo_cambio: string | null
          valor_anterior: number | null
          valor_nuevo: number | null
        }
        Insert: {
          accion_recomendada?: string | null
          created_at?: string | null
          fecha_alerta?: string | null
          id?: string | null
          mensaje?: string | null
          nombre_producto?: string | null
          porcentaje_cambio?: number | null
          procesada?: boolean | null
          producto_id?: string | null
          severidad?: string | null
          tipo_cambio?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number | null
        }
        Update: {
          accion_recomendada?: string | null
          created_at?: string | null
          fecha_alerta?: string | null
          id?: string | null
          mensaje?: string | null
          nombre_producto?: string | null
          porcentaje_cambio?: number | null
          procesada?: boolean | null
          producto_id?: string | null
          severidad?: string | null
          tipo_cambio?: string | null
          valor_anterior?: number | null
          valor_nuevo?: number | null
        }
        Relationships: []
      }
      vista_arbitraje_producto: {
        Row: {
          costo_proveedor_actual: number | null
          costo_proveedor_prev: number | null
          delta_costo_pct: number | null
          fecha_ultima_comparacion: string | null
          margen_bajo: boolean | null
          margen_vs_reposicion: number | null
          nombre_producto: string | null
          precio_venta_actual: number | null
          producto_id: string | null
          riesgo_perdida: boolean | null
          sku: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_comparacion_precios_producto"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_cc_resumen: {
        Row: {
          as_of: string | null
          clientes_con_deuda: number | null
          dinero_en_la_calle: number | null
        }
        Relationships: []
      }
      vista_cc_saldos_por_cliente: {
        Row: {
          cliente_id: string | null
          direccion_default: string | null
          email: string | null
          limite_credito: number | null
          link_pago: string | null
          nombre: string | null
          saldo: number | null
          telefono: string | null
          ultimo_movimiento: string | null
          whatsapp_e164: string | null
        }
        Relationships: []
      }
      vista_cron_jobs_alertas_activas: {
        Row: {
          accion_recomendada: string | null
          canales_notificacion: Json | null
          created_at: string | null
          descripcion: string | null
          estado_alerta: string | null
          execution_id: string | null
          fecha_envio: string | null
          fecha_resolucion: string | null
          id: string | null
          job_id: string | null
          severidad: string | null
          tipo_alerta: string | null
          titulo: string | null
        }
        Insert: {
          accion_recomendada?: string | null
          canales_notificacion?: Json | null
          created_at?: string | null
          descripcion?: string | null
          estado_alerta?: string | null
          execution_id?: string | null
          fecha_envio?: string | null
          fecha_resolucion?: string | null
          id?: string | null
          job_id?: string | null
          severidad?: string | null
          tipo_alerta?: string | null
          titulo?: string | null
        }
        Update: {
          accion_recomendada?: string | null
          canales_notificacion?: Json | null
          created_at?: string | null
          descripcion?: string | null
          estado_alerta?: string | null
          execution_id?: string | null
          fecha_envio?: string | null
          fecha_resolucion?: string | null
          id?: string | null
          job_id?: string | null
          severidad?: string | null
          tipo_alerta?: string | null
          titulo?: string | null
        }
        Relationships: []
      }
      vista_cron_jobs_dashboard: {
        Row: {
          activo: boolean | null
          circuit_breaker_state: string | null
          created_at: string | null
          descripcion: string | null
          duracion_ejecucion_ms: number | null
          error_ultima_ejecucion: string | null
          estado_job: string | null
          id: string | null
          intentos_ejecucion: number | null
          job_id: string | null
          nombre_job: string | null
          proxima_ejecucion: string | null
          resultado_ultima_ejecucion: Json | null
          ultima_ejecucion: string | null
          updated_at: string | null
        }
        Insert: {
          activo?: boolean | null
          circuit_breaker_state?: string | null
          created_at?: string | null
          descripcion?: string | null
          duracion_ejecucion_ms?: number | null
          error_ultima_ejecucion?: string | null
          estado_job?: string | null
          id?: string | null
          intentos_ejecucion?: number | null
          job_id?: string | null
          nombre_job?: string | null
          proxima_ejecucion?: string | null
          resultado_ultima_ejecucion?: Json | null
          ultima_ejecucion?: string | null
          updated_at?: string | null
        }
        Update: {
          activo?: boolean | null
          circuit_breaker_state?: string | null
          created_at?: string | null
          descripcion?: string | null
          duracion_ejecucion_ms?: number | null
          error_ultima_ejecucion?: string | null
          estado_job?: string | null
          id?: string | null
          intentos_ejecucion?: number | null
          job_id?: string | null
          nombre_job?: string | null
          proxima_ejecucion?: string | null
          resultado_ultima_ejecucion?: Json | null
          ultima_ejecucion?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      vista_cron_jobs_metricas_semanales: {
        Row: {
          alertas_generadas_total: number | null
          disponibilidad_promedio: number | null
          ejecuciones_totales: number | null
          job_id: string | null
          semana: string | null
          tiempo_promedio_ms: number | null
        }
        Relationships: []
      }
      vista_ofertas_sugeridas: {
        Row: {
          as_of: string | null
          cantidad_actual: number | null
          codigo_barras: string | null
          descuento_sugerido_pct: number | null
          dias_hasta_vencimiento: number | null
          fecha_vencimiento: string | null
          precio_base: number | null
          precio_oferta_sugerido: number | null
          producto_id: string | null
          producto_nombre: string | null
          sku: string | null
          stock_id: string | null
          ubicacion: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_deposito_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_oportunidades_ahorro: {
        Row: {
          created_at: string | null
          diferencia_absoluta: number | null
          diferencia_porcentual: number | null
          es_oportunidad_ahorro: boolean | null
          fecha_comparacion: string | null
          fuente: string | null
          id: string | null
          nombre_producto: string | null
          precio_actual: number | null
          precio_proveedor: number | null
          producto_id: string | null
          recomendacion: string | null
        }
        Insert: {
          created_at?: string | null
          diferencia_absoluta?: number | null
          diferencia_porcentual?: number | null
          es_oportunidad_ahorro?: boolean | null
          fecha_comparacion?: string | null
          fuente?: string | null
          id?: string | null
          nombre_producto?: string | null
          precio_actual?: number | null
          precio_proveedor?: number | null
          producto_id?: string | null
          recomendacion?: string | null
        }
        Update: {
          created_at?: string | null
          diferencia_absoluta?: number | null
          diferencia_porcentual?: number | null
          es_oportunidad_ahorro?: boolean | null
          fecha_comparacion?: string | null
          fuente?: string | null
          id?: string | null
          nombre_producto?: string | null
          precio_actual?: number | null
          precio_proveedor?: number | null
          producto_id?: string | null
          recomendacion?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_comparacion_precios_producto"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      vista_oportunidades_compra: {
        Row: {
          cantidad_actual: number | null
          costo_proveedor_actual: number | null
          costo_proveedor_prev: number | null
          delta_costo_pct: number | null
          fecha_ultima_comparacion: string | null
          margen_vs_reposicion: number | null
          nivel_stock: string | null
          nombre_producto: string | null
          precio_venta_actual: number | null
          producto_id: string | null
          sku: string | null
          stock_minimo: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_comparacion_precios_producto"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      fn_dashboard_metrics: {
        Args: { p_ubicacion?: string }
        Returns: {
          metric_label: string
          metric_name: string
          metric_value: number
        }[]
      }
      fn_refresh_stock_views: { Args: never; Returns: undefined }
      fnc_deteccion_cambios_significativos: {
        Args: { p_umbral_porcentual?: number }
        Returns: number
      }
      fnc_limpiar_datos_antiguos: { Args: never; Returns: number }
      fnc_margen_sugerido: { Args: { p_producto_id: string }; Returns: number }
      fnc_productos_bajo_minimo: {
        Args: never
        Returns: {
          nombre: string
          producto_id: string
          sku: string
          stock_actual: number
          stock_maximo: number
          stock_minimo: number
        }[]
      }
      fnc_redondear_precio: { Args: { precio: number }; Returns: number }
      fnc_stock_disponible: {
        Args: { p_deposito?: string; p_producto_id: string }
        Returns: {
          deposito: string
          producto_id: string
          stock_disponible: number
        }[]
      }
      has_personal_role: { Args: { roles: string[] }; Returns: boolean }
      refresh_tareas_metricas: { Args: never; Returns: undefined }
      sp_acquire_job_lock: {
        Args: { p_job_id: string; p_lock_seconds?: number; p_owner?: string }
        Returns: boolean
      }
      sp_actualizar_pago_pedido: {
        Args: { p_monto_pagado: number; p_pedido_id: string }
        Returns: Json
      }
      sp_aplicar_oferta_stock: {
        Args: { p_descuento_pct?: number; p_stock_id: string }
        Returns: Json
      }
      sp_aplicar_precio: {
        Args: {
          p_margen_ganancia?: number
          p_precio_compra: number
          p_producto_id: string
        }
        Returns: Json
      }
      sp_cancelar_reserva: {
        Args: { p_reserva_id: string; p_usuario?: string }
        Returns: Json
      }
      sp_check_rate_limit: {
        Args: { p_key: string; p_limit?: number; p_window_seconds?: number }
        Returns: {
          allowed: boolean
          remaining: number
          reset_at: string
        }[]
      }
      sp_circuit_breaker_check: {
        Args: { p_key: string; p_open_timeout_seconds?: number }
        Returns: {
          allows_request: boolean
          current_state: string
          failures: number
        }[]
      }
      sp_circuit_breaker_record: {
        Args: {
          p_event: string
          p_failure_threshold?: number
          p_key: string
          p_open_timeout_seconds?: number
          p_success_threshold?: number
        }
        Returns: {
          allows_request: boolean
          current_state: string
          failures: number
          successes: number
        }[]
      }
      sp_cleanup_rate_limit_state: { Args: never; Returns: number }
      sp_crear_pedido: {
        Args: {
          p_cliente_id?: string
          p_cliente_nombre: string
          p_cliente_telefono?: string
          p_departamento?: string
          p_direccion_entrega?: string
          p_edificio?: string
          p_horario_preferido?: string
          p_items?: Json
          p_observaciones?: string
          p_piso?: string
          p_tipo_entrega?: string
        }
        Returns: Json
      }
      sp_desactivar_oferta_stock: {
        Args: { p_oferta_id: string }
        Returns: Json
      }
      sp_movimiento_inventario: {
        Args: {
          p_cantidad: number
          p_destino?: string
          p_observaciones?: string
          p_orden_compra_id?: string
          p_origen?: string
          p_producto_id: string
          p_proveedor_id?: string
          p_tipo: string
          p_usuario?: string
        }
        Returns: Json
      }
      sp_procesar_venta_pos: { Args: { payload: Json }; Returns: Json }
      sp_registrar_pago_cc: { Args: { payload: Json }; Returns: Json }
      sp_release_job_lock: {
        Args: { p_job_id: string; p_owner?: string }
        Returns: boolean
      }
      sp_reservar_stock: {
        Args: {
          p_cantidad: number
          p_deposito?: string
          p_idempotency_key?: string
          p_producto_id: string
          p_referencia?: string
          p_usuario?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
