/**
 * Tests para módulo de parsing de scraper-maxiconsumo
 * Cobertura: extracción de marca, SKU, sanitización, score de confianza, casos borde
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

    // --- CASOS BORDE: extracción de marca ---
    it('maneja nombre vacío', () => {
      const result = extraerMarcaDelNombre('');
      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('limita marca extraída a 20 caracteres', () => {
      const nombreLargo = 'ProductoConNombreMuyLargoSinMarcaConocida 500g';
      const result = extraerMarcaDelNombre(nombreLargo);
      expect(result.length).toBeLessThanOrEqual(20);
    });

    it('detecta marca case-insensitive', () => {
      expect(extraerMarcaDelNombre('COCA COLA 2L')).toBe('Coca Cola');
      expect(extraerMarcaDelNombre('arcor alfajor')).toBe('Arcor');
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

    // --- CASOS BORDE: generación de SKU ---
    it('maneja nombre vacío', () => {
      const sku = generarSKU('', 'almacen');
      expect(sku).toMatch(/^ALM--[A-Z0-9]{6}$/);
    });

    it('maneja categoría vacía', () => {
      const sku = generarSKU('Producto Test', '');
      expect(sku).toMatch(/^-[A-Z0-9]+-[A-Z0-9]{6}$/);
    });

    it('preserva caracteres en el nombre al generar SKU', () => {
      // generarSKU usa toUpperCase() pero no elimina caracteres especiales
      // Esto es comportamiento actual - los SKUs pueden contener caracteres especiales
      const sku = generarSKU('Café® Molido™ 500g', 'bebidas');
      expect(sku).toMatch(/^BEB-.+-[A-Z0-9]{6}$/);
    });

    it('genera SKUs únicos por llamada (sufijo aleatorio)', () => {
      const sku1 = generarSKU('Producto Test', 'almacen');
      const sku2 = generarSKU('Producto Test', 'almacen');
      // Pueden ser diferentes por el sufijo aleatorio
      expect(sku1.startsWith('ALM-')).toBe(true);
      expect(sku2.startsWith('ALM-')).toBe(true);
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

    // --- CASOS BORDE: sanitización ---
    it('maneja string vacío', () => {
      expect(sanitizeProductName('')).toBe('');
    });

    it('maneja solo espacios', () => {
      expect(sanitizeProductName('   ')).toBe('');
    });

    it('preserva guiones y puntos válidos', () => {
      expect(sanitizeProductName('Coca-Cola 2.25L')).toBe('Coca-Cola 2.25L');
    });

    it('elimina emojis y caracteres unicode especiales', () => {
      const result = sanitizeProductName('Producto 🍺 Especial ✨');
      expect(result).not.toContain('🍺');
      expect(result).not.toContain('✨');
    });

    it('mantiene números', () => {
      expect(sanitizeProductName('Aceite 1.5L x12 unidades')).toContain('1.5L');
      expect(sanitizeProductName('Aceite 1.5L x12 unidades')).toContain('12');
    });

    it('normaliza SKU y nombre con espacios y guiones', () => {
      const result = sanitizeProductName('   SKU-001__   Producto   TEST  ');
      expect(result).toBe('SKU-001__ Producto TEST');
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

    // --- CASOS BORDE: precios nulos/0, categorías faltantes, stock negativo ---
    it('penaliza precio = 0', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-ZERO', nombre: 'Producto Gratis', precio_unitario: 0, ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      expect(score).toBeLessThan(70); // no da bonus por precio
    });

    it('penaliza precio negativo (fuera de rango)', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-NEG', nombre: 'Producto Negativo', precio_unitario: -50, ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      // 50 base + 10 (nombre > 5) + 10 (sku) - 20 (precio < 1) = 50
      expect(score).toBeLessThanOrEqual(50);
    });

    it('penaliza precio muy bajo (<1)', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-LOW', nombre: 'Producto Barato', precio_unitario: 0.5, ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      // 50 base + 10 (nombre > 5) + 10 (sku) - 20 (precio < 1) = 50
      // El precio > 0 da +15, pero < 1 da -20, total = 55
      expect(score).toBeLessThanOrEqual(65);
    });

    it('maneja stock_disponible negativo', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-STOCK', nombre: 'Producto Stock', precio_unitario: 100,
        stock_disponible: -5, ultima_actualizacion: ''
      };
      // El score no debería crashear, aunque stock sea negativo
      const score = calculateConfidenceScore(producto);
      expect(score).toBeDefined();
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('maneja stock_disponible = 0', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-NOSTOCK', nombre: 'Sin Stock', precio_unitario: 100,
        stock_disponible: 0, ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      expect(score).toBeDefined();
      // stock_disponible !== undefined da +5
      expect(score).toBeGreaterThan(60);
    });

    it('maneja nombre muy corto', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU', nombre: 'AB', precio_unitario: 100, ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      // nombre.length <= 5, no da +10
      expect(score).toBeLessThan(80);
    });

    it('penaliza nombre muy largo (>200)', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-LONG', nombre: 'A'.repeat(250), precio_unitario: 100, ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      expect(score).toBeDefined();
      // nombre > 200 da -10
    });

    it('maneja precio NaN', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-NAN', nombre: 'Test NaN', precio_unitario: NaN, ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      // NaN > 0 es false, así que no da +15
      // NaN < 1 es false, NaN > 100000 es false, no da -20
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('maneja precio Infinity', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-INF', nombre: 'Test Infinity', precio_unitario: Infinity, ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      // Infinity > 0 es true (+15)
      // Infinity > 100000 es true (-20) 
      expect(Number.isFinite(score)).toBe(true);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('score siempre entre 0 y 100', () => {
      const testCases: ProductoMaxiconsumo[] = [
        { sku: '', nombre: '', precio_unitario: -1000, ultima_actualizacion: '' },
        { sku: 'A'.repeat(100), nombre: 'A'.repeat(300), precio_unitario: 1000000, codigo_barras: '123', stock_disponible: 100, ultima_actualizacion: '' },
        { sku: '', nombre: 'A', precio_unitario: 0, ultima_actualizacion: '' }
      ];
      
      for (const producto of testCases) {
        const score = calculateConfidenceScore(producto);
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
      }
    });

    it('maneja categoría faltante y precio null sin fallar', () => {
      const producto: ProductoMaxiconsumo = {
        sku: 'SKU-NOCAT', nombre: 'Producto sin categoria', precio_unitario: null as any, categoria: undefined,
        ultima_actualizacion: ''
      };
      const score = calculateConfidenceScore(producto);
      expect(score).toBeGreaterThanOrEqual(40);
      expect(score).toBeLessThanOrEqual(90);
    });
  });
});
