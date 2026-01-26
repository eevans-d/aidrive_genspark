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
          {
            foreignKeyName: "categorias_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "vista_stock_por_categoria"
            referencedColumns: ["categoria_id"]
          },
        ]
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
      precios_historicos: {
        Row: {
          cambio_porcentaje: number | null
          created_at: string | null
          fecha: string | null
          fecha_cambio: string | null
          fuente: string | null
          id: string
          motivo_cambio: string | null
          precio: number | null
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
          fuente?: string | null
          id?: string
          motivo_cambio?: string | null
          precio?: number | null
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
          fuente?: string | null
          id?: string
          motivo_cambio?: string | null
          precio?: number | null
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
          precio_actual: number | null
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
          precio_actual?: number | null
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
          precio_actual?: number | null
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
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vista_stock_por_categoria"
            referencedColumns: ["categoria_id"]
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
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "vista_stock_por_categoria"
            referencedColumns: ["categoria_id"]
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
      vista_stock_por_categoria: {
        Row: {
          cantidad_stock_bajo: number | null
          cantidad_total_stock: number | null
          categoria_id: string | null
          categoria_nombre: string | null
          productos_con_stock: number | null
          productos_stock_bajo: number | null
          total_productos: number | null
          valor_inventario_total: number | null
        }
        Relationships: []
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
      fn_rotacion_productos: {
        Args: { p_dias?: number; p_limite?: number }
        Returns: {
          dias_analisis: number
          dias_cobertura: number
          nivel_rotacion: string
          producto_id: string
          producto_nombre: string
          promedio_diario: number
          sku: string
          stock_actual: number
          total_salidas: number
          total_ventas: number
        }[]
      }
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
      refresh_tareas_metricas: { Args: never; Returns: undefined }
      sp_aplicar_precio: {
        Args: {
          p_margen_ganancia?: number
          p_precio_compra: number
          p_producto_id: string
        }
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
  public: {
    Enums: {},
  },
} as const
