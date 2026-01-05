/**
 * Tests para módulo de matching de scraper-maxiconsumo
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeProductName,
  calculateNameSimilarity,
  calculateMatchConfidence
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
  });
});
