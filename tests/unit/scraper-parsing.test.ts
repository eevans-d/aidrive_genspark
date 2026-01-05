/**
 * Tests para módulo de parsing de scraper-maxiconsumo
 */
import { describe, it, expect } from 'vitest';
import {
  extraerMarcaDelNombre,
  generarSKU,
  sanitizeProductName,
  calculateConfidenceScore
} from '../../supabase/functions/scraper-maxiconsumo/parsing.ts';
import type { ProductoMaxiconsumo } from '../../supabase/functions/scraper-maxiconsumo/types.ts';

describe('scraper-maxiconsumo/parsing', () => {
  describe('extraerMarcaDelNombre', () => {
    it('detecta marca conocida en nombre', () => {
      expect(extraerMarcaDelNombre('Coca Cola 2.25L')).toBe('Coca Cola');
      expect(extraerMarcaDelNombre('Cerveza Quilmes Lata')).toBe('Quilmes');
    });

    it('retorna primera palabra si no hay marca conocida', () => {
      expect(extraerMarcaDelNombre('Producto Generico 500g')).toBe('Producto');
    });
  });

  describe('generarSKU', () => {
    it('genera SKU con formato correcto', () => {
      const sku = generarSKU('Arroz Largo Fino', 'almacen');
      expect(sku).toMatch(/^ALM-[A-Z0-9]+-[A-Z0-9]{6}$/);
    });

    it('limita longitud de palabras', () => {
      const sku = generarSKU('Producto Con Nombre Muy Largo', 'bebidas');
      expect(sku.length).toBeLessThan(30);
    });
  });

  describe('sanitizeProductName', () => {
    it('elimina espacios múltiples', () => {
      expect(sanitizeProductName('Producto   con   espacios')).toBe('Producto con espacios');
    });

    it('elimina caracteres especiales', () => {
      expect(sanitizeProductName('Producto™ ® especial')).toBe('Producto especial');
    });

    it('limita longitud a 255', () => {
      const nombreLargo = 'A'.repeat(300);
      expect(sanitizeProductName(nombreLargo).length).toBe(255);
    });
  });

  describe('calculateConfidenceScore', () => {
    it('score base con datos mínimos', () => {
      const producto: ProductoMaxiconsumo = {
        sku: '', nombre: 'Test', precio_unitario: 0, ultima_actualizacion: ''
      };
      expect(calculateConfidenceScore(producto)).toBeLessThan(60);
    });

    it('score alto con datos completos', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU001',
        nombre: 'Producto Completo',
        precio_unitario: 150,
        codigo_barras: '123',
        stock_disponible: 10,
        ultima_actualizacion: ''
      };
      expect(calculateConfidenceScore(producto)).toBeGreaterThan(70);
    });

    it('penaliza precios fuera de rango', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU001', nombre: 'Producto Caro', precio_unitario: 200000, ultima_actualizacion: ''
      };
      expect(calculateConfidenceScore(producto)).toBeLessThan(70);
    });
  });
});
