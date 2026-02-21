/**
 * Unit tests for backfill-faltantes-recordatorios edge function logic.
 *
 * Since the edge function runs in Deno and uses PostgREST HTTP calls,
 * we extract and test the core logic patterns here:
 *   1. Idempotency: existing tareas with matching faltante_id are skipped.
 *   2. Task payload generation (titulo, descripcion, datos traceability).
 *   3. Dry-run: returns plan without modifying anything.
 *   4. Fail-safe: errors on individual rows don't abort the batch.
 *   5. Double-run idempotency: second execution creates zero new tareas.
 */

import { describe, it, expect } from 'vitest'

// ── Extracted core logic (mirrors edge function) ──────────────────────────

const BACKFILL_VERSION = '1.0.0'

interface FaltanteCritico {
  id: string
  producto_id: string | null
  producto_nombre: string | null
  cantidad_faltante: number | null
  observaciones: string | null
  proveedor_asignado_id: string | null
  fecha_reporte: string | null
}

interface TareaExistente {
  id: string
  datos: { faltante_id?: string; origen?: string } | null
}

/**
 * Determines which faltantes need a new tarea (idempotency filter).
 */
function filterFaltantesSinTarea(
  faltantes: FaltanteCritico[],
  tareasActivas: TareaExistente[],
): { toCreate: FaltanteCritico[]; omitidos: number } {
  const existingFaltanteIds = new Set<string>()

  for (const t of tareasActivas) {
    const faltanteId = t.datos?.faltante_id
    if (typeof faltanteId === 'string' && faltanteId.length > 0) {
      existingFaltanteIds.add(faltanteId)
    }
  }

  const toCreate: FaltanteCritico[] = []
  let omitidos = 0

  for (const f of faltantes) {
    if (existingFaltanteIds.has(f.id)) {
      omitidos++
    } else {
      toCreate.push(f)
    }
  }

  return { toCreate, omitidos }
}

/**
 * Builds the tarea payload for a critical faltante (backfill version).
 */
function buildTareaPayload(f: FaltanteCritico) {
  const productName = (f.producto_nombre ?? '').trim() || 'Producto faltante'
  const safeProductName = productName.slice(0, 80)
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const descriptionParts = [
    'Generado por backfill diario de faltantes críticos.',
    `Producto: ${productName}.`,
    f.cantidad_faltante ? `Cantidad estimada: ${f.cantidad_faltante}.` : null,
    f.observaciones ? `Nota: ${f.observaciones.slice(0, 180)}.` : null,
    f.fecha_reporte
      ? `Reportado: ${new Date(f.fecha_reporte).toLocaleDateString('es-AR')}.`
      : null,
  ].filter(Boolean)

  return {
    titulo: `Reponer urgente: ${safeProductName}`,
    descripcion: descriptionParts.join(' '),
    prioridad: 'urgente',
    estado: 'pendiente',
    tipo: 'reposicion',
    creada_por_nombre: 'Sistema Backfill Diario',
    fecha_vencimiento: dueDate,
    datos: {
      origen: 'cuaderno',
      faltante_id: f.id,
      backfill_version: BACKFILL_VERSION,
    },
  }
}

/**
 * Simulates the full backfill run (dry-run or real).
 * For testing: "real" mode just pushes to an in-memory array.
 */
function simulateBackfillRun(
  faltantes: FaltanteCritico[],
  tareasActivas: TareaExistente[],
  dryRun: boolean,
  createdTareas: TareaExistente[], // mutable output array for "real" mode
  simulateErrorOnId?: string,
): {
  procesados: number
  creados: number
  omitidos: number
  errores: number
  plan: Array<{ faltante_id: string; producto_nombre: string | null }>
} {
  const { toCreate, omitidos } = filterFaltantesSinTarea(faltantes, tareasActivas)

  const result = {
    procesados: faltantes.length,
    creados: 0,
    omitidos,
    errores: 0,
    plan: toCreate.map((f) => ({
      faltante_id: f.id,
      producto_nombre: f.producto_nombre,
    })),
  }

  if (dryRun) return result

  for (const f of toCreate) {
    try {
      if (simulateErrorOnId && f.id === simulateErrorOnId) {
        throw new Error(`Simulated error for faltante ${f.id}`)
      }
      const payload = buildTareaPayload(f)
      const newTareaId = `tarea-${f.id}`
      createdTareas.push({
        id: newTareaId,
        datos: payload.datos,
      })
      result.creados++
    } catch {
      result.errores++
      // Continue — fail-safe per row
    }
  }

  return result
}

// ── Test Data ─────────────────────────────────────────────────────────────

function makeFaltante(overrides: Partial<FaltanteCritico> = {}): FaltanteCritico {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    producto_id: null,
    producto_nombre: 'Leche La Serenísima',
    cantidad_faltante: 10,
    observaciones: null,
    proveedor_asignado_id: null,
    fecha_reporte: new Date().toISOString(),
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('backfill-faltantes-recordatorios', () => {
  describe('filterFaltantesSinTarea() — idempotency', () => {
    it('returns all faltantes when no active tareas exist', () => {
      const faltantes = [makeFaltante({ id: 'f1' }), makeFaltante({ id: 'f2' })]
      const { toCreate, omitidos } = filterFaltantesSinTarea(faltantes, [])
      expect(toCreate).toHaveLength(2)
      expect(omitidos).toBe(0)
    })

    it('omits faltantes that already have active tareas', () => {
      const faltantes = [makeFaltante({ id: 'f1' }), makeFaltante({ id: 'f2' })]
      const tareas: TareaExistente[] = [
        { id: 't1', datos: { faltante_id: 'f1', origen: 'cuaderno' } },
      ]
      const { toCreate, omitidos } = filterFaltantesSinTarea(faltantes, tareas)
      expect(toCreate).toHaveLength(1)
      expect(toCreate[0].id).toBe('f2')
      expect(omitidos).toBe(1)
    })

    it('omits all when every faltante has an active tarea', () => {
      const faltantes = [makeFaltante({ id: 'f1' }), makeFaltante({ id: 'f2' })]
      const tareas: TareaExistente[] = [
        { id: 't1', datos: { faltante_id: 'f1' } },
        { id: 't2', datos: { faltante_id: 'f2' } },
      ]
      const { toCreate, omitidos } = filterFaltantesSinTarea(faltantes, tareas)
      expect(toCreate).toHaveLength(0)
      expect(omitidos).toBe(2)
    })

    it('ignores tareas with null datos', () => {
      const faltantes = [makeFaltante({ id: 'f1' })]
      const tareas: TareaExistente[] = [{ id: 't1', datos: null }]
      const { toCreate, omitidos } = filterFaltantesSinTarea(faltantes, tareas)
      expect(toCreate).toHaveLength(1)
      expect(omitidos).toBe(0)
    })

    it('ignores tareas with empty faltante_id', () => {
      const faltantes = [makeFaltante({ id: 'f1' })]
      const tareas: TareaExistente[] = [{ id: 't1', datos: { faltante_id: '' } }]
      const { toCreate, omitidos } = filterFaltantesSinTarea(faltantes, tareas)
      expect(toCreate).toHaveLength(1)
      expect(omitidos).toBe(0)
    })
  })

  describe('buildTareaPayload() — traceability & format', () => {
    it('includes required traceability fields in datos', () => {
      const f = makeFaltante({ id: 'f-abc' })
      const payload = buildTareaPayload(f)
      expect(payload.datos.origen).toBe('cuaderno')
      expect(payload.datos.faltante_id).toBe('f-abc')
      expect(payload.datos.backfill_version).toBe('1.0.0')
    })

    it('generates correct titulo format', () => {
      const f = makeFaltante({ producto_nombre: 'Coca Cola 500ml' })
      const payload = buildTareaPayload(f)
      expect(payload.titulo).toBe('Reponer urgente: Coca Cola 500ml')
    })

    it('truncates long product names to 80 chars', () => {
      const longName = 'A'.repeat(120)
      const f = makeFaltante({ producto_nombre: longName })
      const payload = buildTareaPayload(f)
      expect(payload.titulo.length).toBeLessThanOrEqual('Reponer urgente: '.length + 80)
    })

    it('uses fallback name for null/empty producto_nombre', () => {
      const f = makeFaltante({ producto_nombre: null })
      const payload = buildTareaPayload(f)
      expect(payload.titulo).toBe('Reponer urgente: Producto faltante')
    })

    it('includes cantidad in descripcion when present', () => {
      const f = makeFaltante({ cantidad_faltante: 15 })
      const payload = buildTareaPayload(f)
      expect(payload.descripcion).toContain('Cantidad estimada: 15')
    })

    it('includes observaciones in descripcion when present', () => {
      const f = makeFaltante({ observaciones: 'Se necesita marca La Serenísima' })
      const payload = buildTareaPayload(f)
      expect(payload.descripcion).toContain('Nota: Se necesita marca La Serenísima')
    })

    it('includes fecha_reporte in descripcion when present', () => {
      const f = makeFaltante({ fecha_reporte: '2026-02-20T10:00:00.000Z' })
      const payload = buildTareaPayload(f)
      expect(payload.descripcion).toContain('Reportado:')
    })

    it('sets correct fixed fields', () => {
      const f = makeFaltante()
      const payload = buildTareaPayload(f)
      expect(payload.prioridad).toBe('urgente')
      expect(payload.estado).toBe('pendiente')
      expect(payload.tipo).toBe('reposicion')
      expect(payload.creada_por_nombre).toBe('Sistema Backfill Diario')
    })

    it('sets fecha_vencimiento to ~24 hours in the future', () => {
      const before = Date.now()
      const f = makeFaltante()
      const payload = buildTareaPayload(f)
      const vencimiento = new Date(payload.fecha_vencimiento).getTime()
      const after = Date.now()
      const twentyFourHours = 24 * 60 * 60 * 1000
      expect(vencimiento).toBeGreaterThanOrEqual(before + twentyFourHours - 100)
      expect(vencimiento).toBeLessThanOrEqual(after + twentyFourHours + 100)
    })
  })

  describe('simulateBackfillRun() — dry-run', () => {
    it('returns plan without creating anything in dry-run', () => {
      const faltantes = [makeFaltante({ id: 'f1' }), makeFaltante({ id: 'f2' })]
      const created: TareaExistente[] = []
      const result = simulateBackfillRun(faltantes, [], true, created)

      expect(result.procesados).toBe(2)
      expect(result.creados).toBe(0) // dry-run: nothing created
      expect(result.omitidos).toBe(0)
      expect(result.errores).toBe(0)
      expect(result.plan).toHaveLength(2)
      expect(created).toHaveLength(0) // no side effects
    })

    it('dry-run correctly reports omitidos', () => {
      const faltantes = [makeFaltante({ id: 'f1' }), makeFaltante({ id: 'f2' })]
      const tareas: TareaExistente[] = [{ id: 't1', datos: { faltante_id: 'f1' } }]
      const created: TareaExistente[] = []
      const result = simulateBackfillRun(faltantes, tareas, true, created)

      expect(result.procesados).toBe(2)
      expect(result.omitidos).toBe(1)
      expect(result.plan).toHaveLength(1)
      expect(result.plan[0].faltante_id).toBe('f2')
    })
  })

  describe('simulateBackfillRun() — real mode', () => {
    it('creates tareas for faltantes without existing tarea', () => {
      const faltantes = [
        makeFaltante({ id: 'f1', producto_nombre: 'Leche' }),
        makeFaltante({ id: 'f2', producto_nombre: 'Pan' }),
      ]
      const created: TareaExistente[] = []
      const result = simulateBackfillRun(faltantes, [], false, created)

      expect(result.procesados).toBe(2)
      expect(result.creados).toBe(2)
      expect(result.omitidos).toBe(0)
      expect(result.errores).toBe(0)
      expect(created).toHaveLength(2)
      expect(created[0].datos?.faltante_id).toBe('f1')
      expect(created[1].datos?.faltante_id).toBe('f2')
    })

    it('skips faltantes that already have active tareas', () => {
      const faltantes = [makeFaltante({ id: 'f1' }), makeFaltante({ id: 'f2' })]
      const existingTareas: TareaExistente[] = [
        { id: 't1', datos: { faltante_id: 'f1' } },
      ]
      const created: TareaExistente[] = []
      const result = simulateBackfillRun(faltantes, existingTareas, false, created)

      expect(result.creados).toBe(1) // only f2
      expect(result.omitidos).toBe(1) // f1 skipped
      expect(created).toHaveLength(1)
      expect(created[0].datos?.faltante_id).toBe('f2')
    })
  })

  describe('fail-safe — per-row error handling', () => {
    it('continues processing after error on one row', () => {
      const faltantes = [
        makeFaltante({ id: 'f1' }),
        makeFaltante({ id: 'f2' }),
        makeFaltante({ id: 'f3' }),
      ]
      const created: TareaExistente[] = []
      const result = simulateBackfillRun(faltantes, [], false, created, 'f2')

      expect(result.procesados).toBe(3)
      expect(result.creados).toBe(2)  // f1 and f3 succeed
      expect(result.errores).toBe(1)  // f2 fails
      expect(created).toHaveLength(2)
    })

    it('returns zero creates when all rows error', () => {
      // Test with single faltante that errors
      const faltantes = [makeFaltante({ id: 'f-bad' })]
      const created: TareaExistente[] = []
      const result = simulateBackfillRun(faltantes, [], false, created, 'f-bad')

      expect(result.procesados).toBe(1)
      expect(result.creados).toBe(0)
      expect(result.errores).toBe(1)
      expect(created).toHaveLength(0)
    })
  })

  describe('double-run idempotency (QG1)', () => {
    it('second run creates zero new tareas when first run covered all faltantes', () => {
      const faltantes = [
        makeFaltante({ id: 'f1', producto_nombre: 'Leche' }),
        makeFaltante({ id: 'f2', producto_nombre: 'Pan' }),
        makeFaltante({ id: 'f3', producto_nombre: 'Azucar' }),
      ]

      // Run 1
      const allCreatedTareas: TareaExistente[] = []
      const run1 = simulateBackfillRun(faltantes, [], false, allCreatedTareas)
      expect(run1.creados).toBe(3)
      expect(allCreatedTareas).toHaveLength(3)

      // Run 2 — same faltantes, but now with the tareas from run 1
      const run2Created: TareaExistente[] = []
      const run2 = simulateBackfillRun(faltantes, allCreatedTareas, false, run2Created)
      expect(run2.creados).toBe(0)
      expect(run2.omitidos).toBe(3)
      expect(run2.errores).toBe(0)
      expect(run2Created).toHaveLength(0)
    })

    it('second run only creates tareas for newly added faltantes', () => {
      const faltantesRun1 = [makeFaltante({ id: 'f1' }), makeFaltante({ id: 'f2' })]
      const allCreated: TareaExistente[] = []
      simulateBackfillRun(faltantesRun1, [], false, allCreated)
      expect(allCreated).toHaveLength(2)

      // Add new faltante f3
      const faltantesRun2 = [...faltantesRun1, makeFaltante({ id: 'f3' })]
      const run2Created: TareaExistente[] = []
      const run2 = simulateBackfillRun(faltantesRun2, allCreated, false, run2Created)
      expect(run2.creados).toBe(1)
      expect(run2.omitidos).toBe(2)
      expect(run2Created).toHaveLength(1)
      expect(run2Created[0].datos?.faltante_id).toBe('f3')
    })

    it('triple-run maintains idempotency', () => {
      const faltantes = [makeFaltante({ id: 'f1' })]
      const all: TareaExistente[] = []

      const r1 = simulateBackfillRun(faltantes, [], false, all)
      expect(r1.creados).toBe(1)

      const r2out: TareaExistente[] = []
      const r2 = simulateBackfillRun(faltantes, all, false, r2out)
      expect(r2.creados).toBe(0)

      const r3out: TareaExistente[] = []
      const r3 = simulateBackfillRun(faltantes, all, false, r3out)
      expect(r3.creados).toBe(0)
    })
  })

  describe('empty input handling', () => {
    it('handles empty faltantes array', () => {
      const created: TareaExistente[] = []
      const result = simulateBackfillRun([], [], false, created)
      expect(result.procesados).toBe(0)
      expect(result.creados).toBe(0)
      expect(result.omitidos).toBe(0)
      expect(result.errores).toBe(0)
    })

    it('dry-run with empty faltantes returns empty plan', () => {
      const result = simulateBackfillRun([], [], true, [])
      expect(result.plan).toHaveLength(0)
    })
  })
})
