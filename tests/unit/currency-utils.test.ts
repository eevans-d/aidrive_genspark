import { describe, it, expect } from 'vitest'
import { money, toCents, fromCents, calcTotal } from '../../minimarket-system/src/utils/currency'

describe('currency utils', () => {
  describe('money()', () => {
    it('formats with 2 decimal places using es-AR locale', () => {
      const result = money(1234.5)
      // es-AR uses dot as thousands separator and comma as decimal
      expect(result).toBe('1.234,50')
    })

    it('formats zero', () => {
      expect(money(0)).toBe('0,00')
    })

    it('formats negative numbers', () => {
      expect(money(-50.1)).toBe('-50,10')
    })

    it('rounds to 2 decimal places', () => {
      expect(money(10.999)).toBe('11,00')
      expect(money(10.994)).toBe('10,99')
    })

    it('formats large numbers with thousands separator', () => {
      expect(money(1000000)).toBe('1.000.000,00')
    })
  })

  describe('toCents()', () => {
    it('converts dollars to cents', () => {
      expect(toCents(10.99)).toBe(1099)
    })

    it('handles zero', () => {
      expect(toCents(0)).toBe(0)
    })

    it('rounds to nearest cent', () => {
      // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754
      expect(toCents(0.1 + 0.2)).toBe(30)
    })

    it('handles large amounts', () => {
      expect(toCents(99999.99)).toBe(9999999)
    })
  })

  describe('fromCents()', () => {
    it('converts cents to dollars', () => {
      expect(fromCents(1099)).toBe(10.99)
    })

    it('handles zero', () => {
      expect(fromCents(0)).toBe(0)
    })

    it('roundtrips with toCents', () => {
      const original = 42.50
      expect(fromCents(toCents(original))).toBe(original)
    })
  })

  describe('calcTotal()', () => {
    it('calculates total from items', () => {
      const items = [
        { precio_unitario: 10.50, cantidad: 2 },
        { precio_unitario: 5.25, cantidad: 3 },
      ]
      // 10.50 * 2 = 21.00, 5.25 * 3 = 15.75, total = 36.75
      expect(calcTotal(items)).toBe(36.75)
    })

    it('returns 0 for empty array', () => {
      expect(calcTotal([])).toBe(0)
    })

    it('handles floating-point edge cases', () => {
      // Classic IEEE 754 problem: 0.1 + 0.2 != 0.3
      const items = [
        { precio_unitario: 0.1, cantidad: 1 },
        { precio_unitario: 0.2, cantidad: 1 },
      ]
      expect(calcTotal(items)).toBe(0.3)
    })

    it('handles single item', () => {
      const items = [{ precio_unitario: 19.99, cantidad: 1 }]
      expect(calcTotal(items)).toBe(19.99)
    })

    it('handles large quantities', () => {
      const items = [{ precio_unitario: 99.99, cantidad: 100 }]
      expect(calcTotal(items)).toBe(9999)
    })
  })
})
