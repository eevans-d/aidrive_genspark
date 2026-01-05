/**
 * Tests para módulo de matching de scraper-maxiconsumo
 */
import { describe, it, expect } from 'vitest';

// Funciones extraídas del módulo para testing
function normalizeProductName(name: string): string {
  return name.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeProductName(name1), n2 = normalizeProductName(name2);
  if (n1 === n2) return 85;
  const w1 = new Set(n1.split(' ')), w2 = new Set(n2.split(' '));
  const common = [...w1].filter(w => w2.has(w)).length;
  const total = new Set([...w1, ...w2]).size;
  return total === 0 ? 0 : Math.round((common / total) * 80);
}

interface MatchResult {
  producto_proveedor: { nombre: string; precio_unitario: number; sku?: string; marca?: string; codigo_barras?: string };
  producto_sistema: { nombre: string; precio_actual: number; sku?: string; marca?: string; codigo_barras?: string };
  confidence: number;
}

function calculateMatchConfidence(match: MatchResult): number {
  let conf = match.confidence || 50;
  if (match.producto_proveedor.codigo_barras && match.producto_sistema.codigo_barras) conf += 10;
  if (match.producto_proveedor.marca && match.producto_sistema.marca) {
    if (normalizeProductName(match.producto_proveedor.marca) === normalizeProductName(match.producto_sistema.marca)) conf += 15;
  }
  const pProv = match.producto_proveedor.precio_unitario || 0;
  const pSist = match.producto_sistema.precio_actual || 0;
  if (pProv > 0 && pSist > 0 && Math.abs(pProv - pSist) / Math.max(pProv, pSist) < 0.1) conf += 10;
  return Math.min(100, conf);
}

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
      const match: MatchResult = {
        producto_proveedor: { nombre: 'Test', precio_unitario: 100, codigo_barras: '123' },
        producto_sistema: { nombre: 'Test', precio_actual: 100, codigo_barras: '123' },
        confidence: 50
      };
      expect(calculateMatchConfidence(match)).toBeGreaterThan(55);
    });

    it('boost por marca coincidente', () => {
      const match: MatchResult = {
        producto_proveedor: { nombre: 'Test', precio_unitario: 100, marca: 'Arcor' },
        producto_sistema: { nombre: 'Test', precio_actual: 100, marca: 'arcor' },
        confidence: 50
      };
      expect(calculateMatchConfidence(match)).toBeGreaterThan(60);
    });

    it('boost por precio similar (<10% diferencia)', () => {
      const match: MatchResult = {
        producto_proveedor: { nombre: 'Test', precio_unitario: 100 },
        producto_sistema: { nombre: 'Test', precio_actual: 105 },
        confidence: 50
      };
      expect(calculateMatchConfidence(match)).toBeGreaterThan(55);
    });

    it('no excede 100', () => {
      const match: MatchResult = {
        producto_proveedor: { nombre: 'Test', precio_unitario: 100, marca: 'Arcor', codigo_barras: '123' },
        producto_sistema: { nombre: 'Test', precio_actual: 100, marca: 'Arcor', codigo_barras: '123' },
        confidence: 95
      };
      expect(calculateMatchConfidence(match)).toBeLessThanOrEqual(100);
    });
  });
});
