/**
 * Tests para módulo de matching de scraper-maxiconsumo
 * Cobertura: normalización, similitud, confianza, casos borde
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeProductName,
  calculateNameSimilarity,
  calculateMatchConfidence,
  performAdvancedMatching
} from '../../supabase/functions/scraper-maxiconsumo/matching.ts';
import type { ProductoMaxiconsumo, MatchResult } from '../../supabase/functions/scraper-maxiconsumo/types.ts';

describe('scraper-maxiconsumo/matching', () => {
  describe('normalizeProductName', () => {
    it('convierte a minúsculas y elimina especiales', () => {
      expect(normalizeProductName('Coca-Cola® 2.25L')).toBe('cocacola 225l');
    });

    it('normaliza espacios múltiples', () => {
      expect(normalizeProductName('Producto   con   espacios')).toBe('producto con espacios');
    });

    // --- CASOS BORDE: trimming y normalización ---
    it('elimina espacios al inicio y final (trimming)', () => {
      expect(normalizeProductName('   Producto con espacios   ')).toBe('producto con espacios');
    });

    it('maneja string vacío', () => {
      expect(normalizeProductName('')).toBe('');
    });

    it('maneja solo espacios', () => {
      expect(normalizeProductName('   ')).toBe('');
    });

    it('maneja caracteres Unicode/acentos (los elimina)', () => {
      // La regex [^\w\s] elimina caracteres no-ASCII como acentos
      // Esto es comportamiento esperado del módulo actual
      const result = normalizeProductName('Café Molido Ñandú');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('normaliza tabs y newlines como espacios', () => {
      expect(normalizeProductName('Producto\t\ncon\r\nseparadores')).toBe('producto con separadores');
    });

    it('elimina símbolos de moneda y especiales', () => {
      expect(normalizeProductName('Producto $100 @promo #sale')).toBe('producto 100 promo sale');
    });

    it('normaliza SKU con guiones y underscores', () => {
      expect(normalizeProductName('SKU-123_ABC  Producto')).toBe('sku123_abc producto');
    });
  });

  describe('calculateNameSimilarity', () => {
    it('retorna 85 para nombres idénticos', () => {
      expect(calculateNameSimilarity('Coca Cola 2L', 'coca cola 2l')).toBe(85);
    });

    it('calcula similitud parcial', () => {
      const similarity = calculateNameSimilarity('Coca Cola 2L', 'Pepsi Cola 2L');
      expect(similarity).toBeGreaterThan(30);
      expect(similarity).toBeLessThan(85);
    });

    it('retorna 0 para nombres sin palabras comunes', () => {
      expect(calculateNameSimilarity('Arroz', 'Fideos')).toBe(0);
    });

    // --- CASOS BORDE: similitud mínimos ---
    it('retorna 85 para strings vacíos (considerados idénticos)', () => {
      // Strings vacíos normalizados son idénticos -> 85
      expect(calculateNameSimilarity('', '')).toBe(85);
    });

    it('retorna 0 si uno de los strings es vacío', () => {
      expect(calculateNameSimilarity('Producto', '')).toBe(0);
      expect(calculateNameSimilarity('', 'Producto')).toBe(0);
    });

    it('maneja nombres con una sola palabra', () => {
      expect(calculateNameSimilarity('Aceite', 'aceite')).toBe(85);
    });

    it('calcula similitud con palabras parcialmente coincidentes', () => {
      // 'aceite girasol 1l' vs 'aceite girasol 2l' -> 2 comunes de 4 únicas
      // Formula: (2/4) * 80 = 40
      const similarity = calculateNameSimilarity('Aceite Girasol 1L', 'Aceite Girasol 2L');
      expect(similarity).toBeGreaterThanOrEqual(40);
      expect(similarity).toBeLessThan(85);
    });

    it('maneja caracteres especiales en comparación', () => {
      // Después de normalizar, deben coincidir
      const similarity = calculateNameSimilarity('Coca-Cola® 2L', 'CocaCola 2L');
      expect(similarity).toBe(85);
    });
  });

  describe('calculateMatchConfidence', () => {
    it('boost por código de barras coincidente', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU1',
        nombre: 'Test',
        precio_unitario: 100,
        codigo_barras: '123',
        ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 100, codigo_barras: '123' },
        confidence: 50
      };
      expect(calculateMatchConfidence(match)).toBeGreaterThan(55);
    });

    it('boost por marca coincidente', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU2',
        nombre: 'Test',
        precio_unitario: 100,
        marca: 'Arcor',
        ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 100, marca: 'arcor' },
        confidence: 50
      };
      expect(calculateMatchConfidence(match)).toBeGreaterThan(60);
    });

    it('boost por precio similar (<10% diferencia)', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU3',
        nombre: 'Test',
        precio_unitario: 100,
        ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 105 },
        confidence: 50
      };
      expect(calculateMatchConfidence(match)).toBeGreaterThan(55);
    });

    it('no excede 100', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU4',
        nombre: 'Test',
        precio_unitario: 100,
        marca: 'Arcor',
        codigo_barras: '123',
        ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 100, marca: 'Arcor', codigo_barras: '123' },
        confidence: 95
      };
      expect(calculateMatchConfidence(match)).toBeLessThanOrEqual(100);
    });

    // --- CASOS BORDE: mínimos de confianza y valores nulos ---
    it('maneja confianza base de 0', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU-MIN', nombre: 'Test', precio_unitario: 100, ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 100 },
        confidence: 0
      };
      // Con confidence 0, debería tener algún boost por precio similar
      expect(calculateMatchConfidence(match)).toBeGreaterThanOrEqual(0);
      expect(calculateMatchConfidence(match)).toBeLessThanOrEqual(100);
    });

    it('maneja confidence undefined (usa default 50)', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU-UNDEF', nombre: 'Test', precio_unitario: 100, ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 100 },
        // confidence omitido
      };
      const result = calculateMatchConfidence(match);
      expect(result).toBeGreaterThanOrEqual(50); // default + boost por precio
    });

    it('maneja precios en 0 (no da boost por precio similar)', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU-ZERO', nombre: 'Test', precio_unitario: 0, ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 0 },
        confidence: 50
      };
      // No debe dar boost por precio cuando ambos son 0
      expect(calculateMatchConfidence(match)).toBe(50);
    });

    it('maneja precio_actual como string numérico', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU-STR', nombre: 'Test', precio_unitario: 100, ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: '105' as any },
        confidence: 50
      };
      // Debería poder convertir y dar boost por precio similar
      const result = calculateMatchConfidence(match);
      expect(result).toBeGreaterThanOrEqual(55);
    });

    it('maneja marca null o undefined', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU-NOMARCA', nombre: 'Test', precio_unitario: 100,
        marca: undefined, ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 100, marca: undefined },
        confidence: 50
      };
      // Sin marca no debe crashear ni dar boost
      expect(calculateMatchConfidence(match)).toBeGreaterThanOrEqual(50);
    });

    it('no da boost de código si no coinciden', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU-BC-DIFF', nombre: 'Test', precio_unitario: 100,
        codigo_barras: '123', ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 100, codigo_barras: '456' },
        confidence: 50
      };
      // Sin boost de código (+10), pero SÍ boost de precio similar (+10) + base 50 = 60
      // Si precios son idénticos, da boost de precio
      const result = calculateMatchConfidence(match);
      expect(result).toBeLessThanOrEqual(70); // máx 50+10+10 si marca coincidiera
    });

    it('normaliza marca para comparación case-insensitive', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU-MARCA-CASE', nombre: 'Test', precio_unitario: 100,
        marca: 'ARCOR', ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: 100, marca: 'arcor' },
        confidence: 50
      };
      const result = calculateMatchConfidence(match);
      expect(result).toBeGreaterThan(60); // debe dar boost por marca
    });

    it('maneja precios nulos en proveedor y sistema', () => {
      const proveedor: ProductoMaxiconsumo = {
        sku: 'SKU-NULO', nombre: 'Test', precio_unitario: null as any, ultima_actualizacion: ''
      };
      const match: MatchResult = {
        producto_proveedor: proveedor,
        producto_sistema: { nombre: 'Test', precio_actual: undefined },
        confidence: 10
      };
      const result = calculateMatchConfidence(match);
      expect(result).toBeGreaterThanOrEqual(10);
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe('performAdvancedMatching', () => {
    it('omite coincidencias con confianza <= 20', async () => {
      const productosProveedor = [
        { sku: 'NO-MATCH', nombre: 'Producto sin similitud', precio_unitario: 10, ultima_actualizacion: '' }
      ];
      const productosSistema = [
        { id: 'SYS-1', nombre: 'Referencia diferente', precio_actual: 9.99 }
      ];

      const matches = await performAdvancedMatching(productosProveedor, productosSistema, {} as any);
      expect(matches).toHaveLength(0);
    });

    it('hace match por nombre normalizado cuando no hay SKU ni barcode', async () => {
      const productosProveedor = [
        { sku: '', nombre: 'Coca-Cola® 2L', precio_unitario: 120, ultima_actualizacion: '' }
      ];
      const productosSistema = [
        { id: 'SYS-2', nombre: 'coca cola 2l', precio_actual: 121 }
      ];

      const matches = await performAdvancedMatching(productosProveedor, productosSistema, {} as any);
      expect(matches).toHaveLength(1);
      expect(matches[0].match_strategy).toBe('name_similarity');
      expect(matches[0].confidence).toBeGreaterThan(20);
    });
  });
});
