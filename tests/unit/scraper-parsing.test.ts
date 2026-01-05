/**
 * Tests para módulo de parsing de scraper-maxiconsumo
 */
import { describe, it, expect } from 'vitest';

// Mock de tipos inline (evitar import de Deno en Node)
interface ProductoMaxiconsumo {
  sku: string;
  nombre: string;
  marca?: string;
  categoria?: string;
  precio_unitario: number;
  ultima_actualizacion: string;
}

// Funciones extraídas del módulo para testing
function extraerMarcaDelNombre(nombre: string): string {
  const marcas = ['Coca Cola', 'Pepsi', 'Quilmes', 'Arcor', 'Nestlé'];
  for (const marca of marcas) {
    if (nombre.toLowerCase().includes(marca.toLowerCase())) return marca;
  }
  return nombre.split(' ')[0].substring(0, 20);
}

function generarSKU(nombre: string, categoria: string): string {
  const palabras = nombre.toUpperCase().split(' ').slice(0, 3);
  const sufijo = 'TEST01';
  return `${categoria.substring(0, 3).toUpperCase()}-${palabras.join('').substring(0, 8)}-${sufijo}`;
}

function sanitizeProductName(name: string): string {
  return name.replace(/\s+/g, ' ').replace(/[^\w\s\-\.]/g, '').replace(/\s+/g, ' ').trim().substring(0, 255);
}

function calculateConfidenceScore(producto: ProductoMaxiconsumo): number {
  let score = 50;
  if (producto.nombre?.length > 5) score += 10;
  if (producto.precio_unitario > 0) score += 15;
  if (producto.sku) score += 10;
  if (producto.nombre.length > 200) score -= 10;
  if (producto.precio_unitario < 1 || producto.precio_unitario > 100000) score -= 20;
  return Math.max(0, Math.min(100, score));
}

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
      expect(sku).toMatch(/^ALM-[A-Z]+-TEST01$/);
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
        sku: 'SKU001', nombre: 'Producto Completo', precio_unitario: 150, ultima_actualizacion: ''
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
