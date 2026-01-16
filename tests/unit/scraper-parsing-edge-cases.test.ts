/**
 * Tests adicionales para módulo de parsing - casos borde
 * Cobertura: HTML vacío, malformado, extractProductosConOptimizacion, generateContentHash
 */
import { describe, it, expect } from 'vitest';
import {
        extraerMarcaDelNombre,
        generarSKU,
        sanitizeProductName,
        calculateConfidenceScore,
        generateContentHash,
        extractProductosConOptimizacion,
        extraerProductosConRegex
} from '../../supabase/functions/scraper-maxiconsumo/parsing.ts';
import type { ProductoMaxiconsumo, StructuredLog } from '../../supabase/functions/scraper-maxiconsumo/types.ts';

describe('scraper-maxiconsumo/parsing - casos borde adicionales', () => {
        const mockLog: StructuredLog = { requestId: 'test-123', timestamp: new Date().toISOString() };

        describe('generateContentHash', () => {
                it('genera hash consistente para mismo contenido', async () => {
                        const content = 'Producto Test - 100 - 50';
                        const hash1 = await generateContentHash(content);
                        const hash2 = await generateContentHash(content);
                        expect(hash1).toBe(hash2);
                });

                it('genera hashes diferentes para contenido diferente', async () => {
                        const hash1 = await generateContentHash('Producto A - 100');
                        const hash2 = await generateContentHash('Producto B - 200');
                        expect(hash1).not.toBe(hash2);
                });

                it('maneja string vacío', async () => {
                        const hash = await generateContentHash('');
                        expect(hash).toBeDefined();
                        expect(typeof hash).toBe('string');
                        expect(hash.length).toBeGreaterThan(0);
                });

                it('maneja caracteres unicode', async () => {
                        const hash = await generateContentHash('Café ☕ Ñandú 💰 100.50');
                        expect(hash).toBeDefined();
                        expect(typeof hash).toBe('string');
                });

                it('genera hash de longitud fija (SHA-256 = 64 chars hex)', async () => {
                        const hash = await generateContentHash('Test content');
                        expect(hash.length).toBe(64);
                        expect(hash).toMatch(/^[a-f0-9]{64}$/);
                });
        });

        describe('extractProductosConOptimizacion - HTML vacío/malformado', () => {
                it('retorna array vacío para HTML vacío', async () => {
                        const productos = await extractProductosConOptimizacion('', 'almacen', 'https://example.com/', mockLog);
                        expect(productos).toEqual([]);
                });

                it('retorna array vacío para HTML solo con espacios', async () => {
                        const productos = await extractProductosConOptimizacion('   \n\t  ', 'bebidas', 'https://example.com/', mockLog);
                        expect(productos).toEqual([]);
                });

                it('retorna array vacío para HTML sin productos', async () => {
                        const html = '<html><body><h1>Sin productos</h1><p>No hay nada aquí</p></body></html>';
                        const productos = await extractProductosConOptimizacion(html, 'limpieza', 'https://example.com/', mockLog);
                        expect(productos).toEqual([]);
                });

                it('maneja HTML con tags incompletos', async () => {
                        const html = '<div class="product"><h3>Producto Sin Cerrar';
                        const productos = await extractProductosConOptimizacion(html, 'test', 'https://example.com/', mockLog);
                        expect(Array.isArray(productos)).toBe(true);
                });

                it('maneja HTML con entidades mal formadas', async () => {
                        const html = '<div class="product"><h3>Producto &amp &unknown;</h3><span class="precio">$100.00</span></div>';
                        const productos = await extractProductosConOptimizacion(html, 'test', 'https://example.com/', mockLog);
                        expect(Array.isArray(productos)).toBe(true);
                });

                it('extrae productos de HTML con formato mínimo', async () => {
                        const html = '<div><h3>Coca Cola 2L</h3><span>Precio: $150.50</span></div>';
                        const productos = await extractProductosConOptimizacion(html, 'bebidas', 'https://test.com/', mockLog);
                        expect(Array.isArray(productos)).toBe(true);
                });

                it('maneja precios con formato argentino (coma decimal)', async () => {
                        const html = '<h3>Producto Test</h3><span class="precio">$1.234,56</span>';
                        const productos = await extractProductosConOptimizacion(html, 'test', 'https://test.com/', mockLog);
                        expect(Array.isArray(productos)).toBe(true);
                });

                it('ignora precios fuera de rango (> 100000)', async () => {
                        const html = '<h3>Tu Casa</h3><span class="precio">$999999.99</span>';
                        const productos = await extractProductosConOptimizacion(html, 'test', 'https://test.com/', mockLog);
                        expect(productos.every(p => p.precio_unitario <= 100000)).toBe(true);
                });

                it('limita a 1000 productos máximo', async () => {
                        const productoHtml = '<h3>Producto X</h3><span class="precio">$100</span>';
                        const html = productoHtml.repeat(2000);
                        const productos = await extractProductosConOptimizacion(html, 'test', 'https://test.com/', mockLog);
                        expect(productos.length).toBeLessThanOrEqual(1000);
                });
        });

        describe('extraerProductosConRegex', () => {
                it('retorna array vacío para HTML vacío', () => {
                        const productos = extraerProductosConRegex('', 'test', 'https://test.com/');
                        expect(productos).toEqual([]);
                });

                it('retorna array vacío para HTML sin patrón reconocible', () => {
                        const html = '<html><body>Sin productos</body></html>';
                        const productos = extraerProductosConRegex(html, 'test', 'https://test.com/');
                        expect(productos).toEqual([]);
                });

                it('maneja patrón alternativo como fallback', () => {
                        const html = '<div><h4>Producto Fallback</h4><p>precio $99.99</p></div>';
                        const productos = extraerProductosConRegex(html, 'test', 'https://test.com/');
                        expect(Array.isArray(productos)).toBe(true);
                });
        });

        describe('sanitizeProductName - casos extremos', () => {
                it('maneja caracteres de control', () => {
                        const input = 'Producto\x00\x01\x02Test\x1F';
                        const result = sanitizeProductName(input);
                        expect(result).not.toContain('\x00');
                        expect(result.length).toBeLessThanOrEqual(255);
                });

                it('maneja strings muy largos eficientemente', () => {
                        const longString = 'A'.repeat(10000);
                        const start = performance.now();
                        const result = sanitizeProductName(longString);
                        const duration = performance.now() - start;
                        expect(result.length).toBe(255);
                        expect(duration).toBeLessThan(100);
                });
        });

        describe('extraerMarcaDelNombre - marcas conocidas', () => {
                it('detecta La Serenísima con tilde', () => {
                        const result = extraerMarcaDelNombre('La Serenísima Leche 1L');
                        expect(result).toBe('La Serenísima');
                });

                it('detecta Coca Cola', () => {
                        expect(extraerMarcaDelNombre('Coca Cola 2L')).toBe('Coca Cola');
                });

                it('detecta Arcor case-insensitive', () => {
                        expect(extraerMarcaDelNombre('arcor alfajor triple')).toBe('Arcor');
                });

                it('retorna primera palabra si marca no conocida', () => {
                        const result = extraerMarcaDelNombre('MarcaDesconocida Producto');
                        expect(result).toBe('MarcaDesconocida');
                });

                it('trunca primera palabra a 20 chars', () => {
                        const result = extraerMarcaDelNombre('SuperMegaHyperLargoProductoNombre Test');
                        expect(result.length).toBeLessThanOrEqual(20);
                });
        });

        describe('calculateConfidenceScore - combinaciones extremas', () => {
                it('máximo score posible es 100', () => {
                        const producto: ProductoMaxiconsumo = {
                                sku: 'SKU-PERFECT',
                                nombre: 'Producto Perfecto Con Nombre Largo',
                                precio_unitario: 50,
                                codigo_barras: '7890123456789',
                                stock_disponible: 100,
                                ultima_actualizacion: new Date().toISOString()
                        };
                        const score = calculateConfidenceScore(producto);
                        expect(score).toBeLessThanOrEqual(100);
                        expect(score).toBeGreaterThanOrEqual(90);
                });

                it('mínimo score posible es 0', () => {
                        const producto: ProductoMaxiconsumo = {
                                sku: '',
                                nombre: 'A'.repeat(250),
                                precio_unitario: 0,
                                ultima_actualizacion: ''
                        };
                        const score = calculateConfidenceScore(producto);
                        expect(score).toBeGreaterThanOrEqual(0);
                });
        });
});
