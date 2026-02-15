/**
 * Edge Function: reposicion-sugerida
 * 
 * Genera sugerencias de reposición basadas en:
 * - Stock mínimo configurado
 * - Rotación de productos (consumo promedio)
 * - Stock actual vs stock máximo
 * 
 * Query params:
 * - dias_analisis: Días para calcular rotación (default: 30)
 * - umbral_reposicion: % de stock mínimo para alertar (default: 100)
 * - incluir_proximo: Incluir productos próximos al umbral (default: true)
 * 
 * Respuesta:
 * {
 *   sugerencias: [
 *     {
 *       producto_id, nombre, codigo_barras,
 *       stock_actual, stock_minimo, stock_maximo,
 *       rotacion_diaria, dias_sin_stock,
 *       cantidad_sugerida, nivel: 'critico'|'bajo'|'proximo',
 *       proveedor_preferido
 *     }
 *   ],
 *   metadata: { productos_analizados, productos_sugeridos, fecha_calculo }
 * }
 */

import { getCorsHeaders, handleCors } from '../_shared/cors.ts'
import { ok, fail } from '../_shared/response.ts'
import { createLogger } from '../_shared/logger.ts'
import { requireServiceRoleAuth } from '../_shared/internal-auth.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const logger = createLogger('reposicion-sugerida');

interface SugerenciaReposicion {
  producto_id: string
  nombre: string
  codigo_barras: string | null
  stock_actual: number
  stock_minimo: number
  stock_maximo: number
  rotacion_diaria: number
  dias_sin_stock: number
  cantidad_sugerida: number
  nivel: 'critico' | 'bajo' | 'proximo'
  proveedor_preferido: {
    id: string
    nombre: string
  } | null
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders()
  const preflight = handleCors(req, corsHeaders)
  if (preflight) {
    return preflight
  }

  try {
    logger.info('=== Reposicion Sugerida: Inicio ===')

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configuración de Supabase faltante')
    }

    const requestId = req.headers.get('x-request-id') || crypto.randomUUID()
    const authCheck = requireServiceRoleAuth(req, supabaseKey, corsHeaders, requestId)
    if (!authCheck.authorized) {
      logger.warn('UNAUTHORIZED_REQUEST', { requestId })
      return authCheck.errorResponse as Response
    }

    const url = new URL(req.url)

    // Parse query params
    const diasAnalisis = parseInt(url.searchParams.get('dias_analisis') || '30')
    const umbralReposicion = parseInt(url.searchParams.get('umbral_reposicion') || '100')
    const incluirProximo = url.searchParams.get('incluir_proximo') !== 'false'

    logger.info('Parametros', { diasAnalisis, umbralReposicion, incluirProximo })

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Get stock data with product info
    const { data: stockData, error: stockError } = await supabase
      .from('stock_deposito')
      .select(`
        id,
        producto_id,
        cantidad_actual,
        stock_minimo,
        stock_maximo,
        productos (
          id,
          nombre,
          codigo_barras,
          proveedor_id,
          proveedores (
            id,
            nombre
          )
        )
      `)
      .not('stock_minimo', 'is', null)
      .order('cantidad_actual', { ascending: true })

    if (stockError) {
      logger.error('Error fetching stock', { error: stockError })
      throw stockError
    }

    logger.info(`Stock data fetched: ${stockData?.length || 0} products`)

    // 2. Calculate rotation (movimientos_deposito)
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - diasAnalisis)

    const { data: movimientos, error: movError } = await supabase
      .from('movimientos_deposito')
      .select('producto_id, cantidad, tipo_movimiento')
      .gte('fecha_movimiento', fechaInicio.toISOString())
      .in('tipo_movimiento', ['salida', 'venta'])

    if (movError) {
      logger.warn('Error fetching movimientos, using zero rotation', { error: movError })
    }

    // Aggregate rotation by product
    const rotacionMap = new Map<string, number>()
    if (movimientos) {
      movimientos.forEach(mov => {
        const actual = rotacionMap.get(mov.producto_id) || 0
        rotacionMap.set(mov.producto_id, actual + Math.abs(mov.cantidad))
      })
    }

    // 3. Build suggestions
    const sugerencias: SugerenciaReposicion[] = []
    
    stockData?.forEach(stock => {
      const producto = stock.productos as any
      if (!producto) return

      const stockActual = stock.cantidad_actual || 0
      const stockMin = stock.stock_minimo || 0
      const stockMax = stock.stock_maximo || stockMin * 3

      // Calculate rotation
      const consumoTotal = rotacionMap.get(stock.producto_id) || 0
      const rotacionDiaria = consumoTotal / diasAnalisis

      // Determine if needs reposition
      const porcentajeStock = stockMin > 0 ? (stockActual / stockMin) * 100 : 100
      
      let nivel: 'critico' | 'bajo' | 'proximo' | null = null
      if (stockActual <= 0) {
        nivel = 'critico'
      } else if (porcentajeStock < 50) {
        nivel = 'critico'
      } else if (porcentajeStock < umbralReposicion) {
        nivel = 'bajo'
      } else if (incluirProximo && porcentajeStock < 120) {
        nivel = 'proximo'
      }

      if (!nivel) return // Skip this product

      // Calculate suggested quantity
      let cantidadSugerida = 0
      if (rotacionDiaria > 0) {
        // Stock for 7-15 days based on rotation
        const diasCobertura = nivel === 'critico' ? 15 : 10
        cantidadSugerida = Math.ceil(rotacionDiaria * diasCobertura)
      } else {
        // No rotation data: suggest to reach stock_maximo
        cantidadSugerida = stockMax - stockActual
      }

      // Ensure at least reaching stock_minimo
      cantidadSugerida = Math.max(cantidadSugerida, stockMin - stockActual)

      // Cap at stock_maximo
      if (stockActual + cantidadSugerida > stockMax) {
        cantidadSugerida = stockMax - stockActual
      }

      // Calculate days until stockout
      const diasSinStock = rotacionDiaria > 0 
        ? Math.floor(stockActual / rotacionDiaria)
        : 999

      sugerencias.push({
        producto_id: stock.producto_id,
        nombre: producto.nombre,
        codigo_barras: producto.codigo_barras,
        stock_actual: stockActual,
        stock_minimo: stockMin,
        stock_maximo: stockMax,
        rotacion_diaria: Math.round(rotacionDiaria * 100) / 100,
        dias_sin_stock: diasSinStock,
        cantidad_sugerida: cantidadSugerida,
        nivel,
        proveedor_preferido: producto.proveedores ? {
          id: producto.proveedores.id,
          nombre: producto.proveedores.nombre
        } : null
      })
    })

    // Sort: critico > bajo > proximo, then by dias_sin_stock
    sugerencias.sort((a, b) => {
      const nivelOrder = { critico: 0, bajo: 1, proximo: 2 }
      if (nivelOrder[a.nivel] !== nivelOrder[b.nivel]) {
        return nivelOrder[a.nivel] - nivelOrder[b.nivel]
      }
      return a.dias_sin_stock - b.dias_sin_stock
    })

    const metadata = {
      productos_analizados: stockData?.length || 0,
      productos_sugeridos: sugerencias.length,
      fecha_calculo: new Date().toISOString(),
      parametros: { diasAnalisis, umbralReposicion, incluirProximo }
    }

    logger.info('Sugerencias generadas', {
      total: sugerencias.length,
      criticos: sugerencias.filter(s => s.nivel === 'critico').length,
      bajos: sugerencias.filter(s => s.nivel === 'bajo').length,
      proximos: sugerencias.filter(s => s.nivel === 'proximo').length
    })

    return ok({ sugerencias, metadata }, 200, corsHeaders)

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error in reposicion-sugerida', { error: errorMessage })
    return fail(
      'REPOSICION_SUGERIDA_ERROR',
      error instanceof Error ? error.message : 'Error interno del servidor',
      500,
      corsHeaders
    )
  }
})
