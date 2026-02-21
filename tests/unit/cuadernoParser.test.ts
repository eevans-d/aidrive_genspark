import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import {
  parseNote, resolveProveedor, isDuplicate, generatePurchaseSummary,
  type ProveedorMatch, type ProductoMatch, type ParsedNote,
} from '../../minimarket-system/src/utils/cuadernoParser'

// ────────────────────────────────────────────────────
// parseNote()
// ────────────────────────────────────────────────────

describe('parseNote()', () => {
  describe('action extraction', () => {
    it('defaults to reponer when no keyword found', () => {
      const r = parseNote('leche')
      expect(r.accion).toBe('reponer')
    })

    it.each([
      ['reponer leche', 'reponer'],
      ['comprar harina', 'comprar'],
      ['pedir azucar', 'comprar'],
      ['falta coca cola', 'reponer'],
      ['se acabó el arroz', 'reponer'],
      ['no hay yerba', 'reponer'],
      ['revisar heladera', 'observacion'],
      ['nota: vencimiento de leche', 'observacion'],
      ['se rompió la heladera', 'incidencia'],
      ['problema con el freezer', 'incidencia'],
      ['vencidos los yogures', 'incidencia'],
    ])('"%s" → accion "%s"', (text, expected) => {
      expect(parseNote(text).accion).toBe(expected)
    })
  })

  describe('priority extraction', () => {
    it('defaults to normal', () => {
      expect(parseNote('leche').prioridad).toBe('normal')
    })

    it('detects alta with urgente', () => {
      expect(parseNote('reponer leche urgente').prioridad).toBe('alta')
    })

    it('detects alta with hoy', () => {
      expect(parseNote('comprar pan hoy').prioridad).toBe('alta')
    })

    it('detects baja with cuando puedas', () => {
      expect(parseNote('reponer servilletas cuando puedas').prioridad).toBe('baja')
    })

    it('detects baja with mañana', () => {
      expect(parseNote('comprar jabón mañana').prioridad).toBe('baja')
    })

    it('incidencia defaults to alta when no priority keyword', () => {
      const r = parseNote('se rompió la balanza')
      expect(r.accion).toBe('incidencia')
      expect(r.prioridad).toBe('alta')
    })

    it('incidencia respects explicit baja priority', () => {
      const r = parseNote('roto el cartel, baja prioridad')
      expect(r.accion).toBe('incidencia')
      expect(r.prioridad).toBe('baja')
    })
  })

  describe('quantity extraction', () => {
    it('returns null when no quantity', () => {
      const r = parseNote('reponer leche')
      expect(r.cantidad).toBeNull()
      expect(r.unidad).toBeNull()
    })

    it('extracts integer', () => {
      const r = parseNote('reponer 10 leche')
      expect(r.cantidad).toBe(10)
    })

    it('extracts decimal with dot', () => {
      const r = parseNote('comprar 2.5 kg arroz')
      expect(r.cantidad).toBe(2.5)
      expect(r.unidad).toBe('kg')
    })

    it('extracts decimal with comma', () => {
      const r = parseNote('traer 1,5 litros de aceite')
      expect(r.cantidad).toBe(1.5)
      expect(r.unidad).toBe('litros')
    })

    it('extracts cajas unit', () => {
      const r = parseNote('pedir 3 cajas de galletitas')
      expect(r.cantidad).toBe(3)
      expect(r.unidad).toBe('cajas')
    })

    it('extracts paquetes unit', () => {
      const r = parseNote('faltan 5 paquetes de servilletas')
      expect(r.cantidad).toBe(5)
      expect(r.unidad).toBe('paquetes')
    })
  })

  describe('product name extraction', () => {
    it('extracts product after action keyword', () => {
      const r = parseNote('reponer coca cola')
      expect(r.productoNombre).toBe('coca cola')
    })

    it('extracts product removing action and quantity', () => {
      const r = parseNote('comprar 3 cajas galletitas')
      expect(r.productoNombre).toBeTruthy()
    })

    it('returns null for empty text after cleanup', () => {
      const r = parseNote('reponer')
      expect(r.productoNombre).toBeNull()
    })

    it('removes priority keywords from product name', () => {
      const r = parseNote('reponer leche urgente')
      expect(r.productoNombre).not.toContain('urgente')
    })
  })

  describe('supplier matching', () => {
    const proveedores: ProveedorMatch[] = [
      { id: 'p1', nombre: 'Distribuidora Norte' },
      { id: 'p2', nombre: 'Coca Cola' },
    ]

    it('matches supplier mention by name', () => {
      const r = parseNote('pedir a Distribuidora Norte galletitas', proveedores)
      expect(r.proveedorMencionado).toBe('Distribuidora Norte')
    })

    it('returns null when no supplier matches', () => {
      const r = parseNote('reponer leche', proveedores)
      expect(r.proveedorMencionado).toBeNull()
    })

    it('prefers longer supplier name match', () => {
      const provs: ProveedorMatch[] = [
        { id: 'p1', nombre: 'Norte' },
        { id: 'p2', nombre: 'Distribuidora Norte' },
      ]
      const r = parseNote('pedido de Distribuidora Norte', provs)
      expect(r.proveedorMencionado).toBe('Distribuidora Norte')
    })
  })

  describe('product catalog matching', () => {
    const productos: ProductoMatch[] = [
      { id: 'prod1', nombre: 'Coca Cola 500ml', proveedor_principal_id: 'p1' },
      { id: 'prod2', nombre: 'Pan Lactal Bimbo', proveedor_principal_id: null },
    ]

    it('matches known product by containment', () => {
      const r = parseNote('reponer coca cola', [], productos)
      expect(r.productoNombre).toBe('Coca Cola 500ml')
    })

    it('does not match when text is unrelated', () => {
      const r = parseNote('reponer yerba', [], productos)
      expect(r.productoNombre).not.toBe('Coca Cola 500ml')
    })
  })

  describe('preserves textoOriginal', () => {
    it('trims and stores original text', () => {
      const r = parseNote('  reponer leche  ')
      expect(r.textoOriginal).toBe('reponer leche')
    })
  })
})

// ────────────────────────────────────────────────────
// resolveProveedor()
// ────────────────────────────────────────────────────

describe('resolveProveedor()', () => {
  const proveedores: ProveedorMatch[] = [
    { id: 'prov-1', nombre: 'MaxiConsumo' },
    { id: 'prov-2', nombre: 'Distribuidora Sur' },
  ]
  const productos: ProductoMatch[] = [
    { id: 'prod-1', nombre: 'Coca Cola 500ml', proveedor_principal_id: 'prov-1' },
    { id: 'prod-2', nombre: 'Yerba Mate', proveedor_principal_id: null },
  ]

  it('returns sin_match when no product and no supplier', () => {
    const parsed: ParsedNote = {
      accion: 'reponer', productoNombre: null, cantidad: null,
      unidad: null, prioridad: 'normal', proveedorMencionado: null,
      textoOriginal: 'algo',
    }
    const r = resolveProveedor(parsed, proveedores, productos)
    expect(r.confidence).toBe('sin_match')
    expect(r.proveedorId).toBeNull()
    expect(r.productoId).toBeNull()
  })

  it('returns media confidence when product has proveedor_principal_id', () => {
    const parsed: ParsedNote = {
      accion: 'reponer', productoNombre: 'Coca Cola 500ml', cantidad: null,
      unidad: null, prioridad: 'normal', proveedorMencionado: null,
      textoOriginal: 'reponer coca cola',
    }
    const r = resolveProveedor(parsed, proveedores, productos)
    expect(r.confidence).toBe('media')
    expect(r.proveedorId).toBe('prov-1')
    expect(r.productoId).toBe('prod-1')
  })

  it('returns alta confidence when supplier explicitly mentioned', () => {
    const parsed: ParsedNote = {
      accion: 'comprar', productoNombre: 'galletitas', cantidad: null,
      unidad: null, prioridad: 'normal', proveedorMencionado: 'MaxiConsumo',
      textoOriginal: 'comprar galletitas MaxiConsumo',
    }
    const r = resolveProveedor(parsed, proveedores, productos)
    expect(r.confidence).toBe('alta')
    expect(r.proveedorId).toBe('prov-1')
  })

  it('explicit supplier mention overrides product-based assignment', () => {
    const parsed: ParsedNote = {
      accion: 'reponer', productoNombre: 'Coca Cola 500ml', cantidad: null,
      unidad: null, prioridad: 'normal', proveedorMencionado: 'Distribuidora Sur',
      textoOriginal: 'reponer coca cola Distribuidora Sur',
    }
    const r = resolveProveedor(parsed, proveedores, productos)
    // Product matched to prov-1, but explicit mention of prov-2 should win
    expect(r.confidence).toBe('alta')
    expect(r.proveedorId).toBe('prov-2')
    expect(r.productoId).toBe('prod-1')
  })

  it('returns productoId but null proveedorId for product without supplier', () => {
    const parsed: ParsedNote = {
      accion: 'reponer', productoNombre: 'Yerba Mate', cantidad: null,
      unidad: null, prioridad: 'normal', proveedorMencionado: null,
      textoOriginal: 'reponer yerba mate',
    }
    const r = resolveProveedor(parsed, proveedores, productos)
    expect(r.productoId).toBe('prod-2')
    expect(r.proveedorId).toBeNull()
  })
})

// ────────────────────────────────────────────────────
// isDuplicate()
// ────────────────────────────────────────────────────

describe('isDuplicate()', () => {
  const now = new Date().toISOString()
  const oldDate = new Date(Date.now() - 120 * 60 * 1000).toISOString() // 2h ago

  const existing = [
    { producto_nombre: 'Leche', producto_id: 'id-1', created_at: now, resuelto: false },
    { producto_nombre: 'Pan', producto_id: 'id-2', created_at: oldDate, resuelto: false },
    { producto_nombre: 'Coca Cola', producto_id: 'id-3', created_at: now, resuelto: true },
  ]

  it('returns false when newNote has no product info', () => {
    expect(isDuplicate({ productoNombre: null, productoId: null }, existing)).toBe(false)
  })

  it('detects duplicate by exact product_id within window', () => {
    expect(isDuplicate({ productoNombre: null, productoId: 'id-1' }, existing)).toBe(true)
  })

  it('does not detect duplicate by product_id outside window', () => {
    expect(isDuplicate({ productoNombre: null, productoId: 'id-2' }, existing)).toBe(false)
  })

  it('ignores resolved items', () => {
    expect(isDuplicate({ productoNombre: 'Coca Cola', productoId: 'id-3' }, existing)).toBe(false)
  })

  it('detects duplicate by exact name match', () => {
    expect(isDuplicate({ productoNombre: 'Leche', productoId: null }, existing)).toBe(true)
  })

  it('detects duplicate by containment (newNote contains existing)', () => {
    expect(isDuplicate({ productoNombre: 'Leche entera', productoId: null }, existing)).toBe(true)
  })

  it('detects duplicate by containment (existing contains newNote)', () => {
    // "Lech" (4 chars) is contained in "Leche" (5 chars), both > 3 — IS a duplicate
    expect(isDuplicate({ productoNombre: 'Lech', productoId: null }, existing)).toBe(true)
  })

  it('does not detect short strings as duplicates (length <= 3)', () => {
    const shortExisting = [
      { producto_nombre: 'Pan', producto_id: null, created_at: now, resuelto: false },
    ]
    // "Pan" is 3 chars — containment check skipped but exact match works
    expect(isDuplicate({ productoNombre: 'Pan', productoId: null }, shortExisting)).toBe(true) // exact match
    expect(isDuplicate({ productoNombre: 'Pa', productoId: null }, shortExisting)).toBe(false) // neither exact nor containment (too short)
  })

  it('respects custom window', () => {
    const recentItem = [
      { producto_nombre: 'Leche', producto_id: null, created_at: now, resuelto: false },
    ]
    expect(isDuplicate({ productoNombre: 'Leche', productoId: null }, recentItem, 1)).toBe(true)
  })
})

// ────────────────────────────────────────────────────
// generatePurchaseSummary()
// ────────────────────────────────────────────────────

describe('generatePurchaseSummary()', () => {
  it('generates summary with header and date', () => {
    const summary = generatePurchaseSummary('MaxiConsumo', [])
    expect(summary).toContain('PEDIDO PARA: MaxiConsumo')
    expect(summary).toContain('Fecha:')
    expect(summary).toContain('Total items: 0')
  })

  it('separates urgentes from normales', () => {
    const items = [
      { producto_nombre: 'Leche', cantidad_faltante: 5, prioridad: 'alta', observaciones: null },
      { producto_nombre: 'Pan', cantidad_faltante: 2, prioridad: 'normal', observaciones: 'integral' },
    ]
    const summary = generatePurchaseSummary('Proveedor X', items)
    expect(summary).toContain('URGENTE:')
    expect(summary).toContain('Leche x5')
    expect(summary).toContain('NORMAL:')
    expect(summary).toContain('Pan x2 (integral)')
    expect(summary).toContain('Total items: 2')
  })

  it('handles items without quantity or observations', () => {
    const items = [
      { producto_nombre: 'Galletitas', cantidad_faltante: null, prioridad: 'normal', observaciones: null },
    ]
    const summary = generatePurchaseSummary('ProvTest', items)
    expect(summary).toContain('Galletitas')
    expect(summary).not.toContain(' x')
  })

  it('handles null product name', () => {
    const items = [
      { producto_nombre: null, cantidad_faltante: 1, prioridad: 'alta', observaciones: null },
    ]
    const summary = generatePurchaseSummary('Prov', items)
    expect(summary).toContain('Sin nombre')
  })

  it('does not show NORMAL label when no urgentes', () => {
    const items = [
      { producto_nombre: 'Leche', cantidad_faltante: 3, prioridad: 'normal', observaciones: null },
    ]
    const summary = generatePurchaseSummary('Prov', items)
    expect(summary).not.toContain('URGENTE:')
    expect(summary).not.toContain('NORMAL:')
    expect(summary).toContain('Leche x3')
  })
})
