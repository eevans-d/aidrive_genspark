/**
 * Módulo de parsing HTML para scraper-maxiconsumo
 * @module scraper-maxiconsumo/parsing
 */

import { createLogger } from '../_shared/logger.ts';
import type { ProductoMaxiconsumo, StructuredLog } from './types.ts';

const logger = createLogger('scraper-maxiconsumo:parsing');

// Marcas conocidas
// Marcas conocidas ordenadas por longitud descendente para evitar partial matching incorrecto
const MARCAS_CONOCIDAS = [
  'La Serenísima', 'Coca Cola', 'Fernandez', 'Ledesma', 'Jorgito',
  'Quilmes', 'Nestlé', 'Fernet', 'Corona', 'Bagley', 'Alcazar',
  'Tregar', 'Danone', 'Aceite', 'Harina', 'Pepsi', 'Arcor',
  'Ariel', 'Drive', 'Eden', 'Ser', 'Ala', 'Arroz'
];

export function extraerMarcaDelNombre(nombre: string): string {
  for (const marca of MARCAS_CONOCIDAS) {
    if (nombre.toLowerCase().includes(marca.toLowerCase())) return marca;
  }
  return nombre.split(' ')[0].substring(0, 20);
}

export function generarSKU(nombre: string, categoria: string): string {
  const palabras = nombre.toUpperCase().split(' ').slice(0, 3);
  const sufijo = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${categoria.substring(0, 3).toUpperCase()}-${palabras.join('').substring(0, 8)}-${sufijo}`;
}

export function sanitizeProductName(name: string): string {
  return name
    .replace(/[^\w\s\-\.]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 255);
}

export function calculateConfidenceScore(producto: ProductoMaxiconsumo): number {
  let score = 50;
  if (producto.nombre?.length > 5) score += 10;
  if (producto.precio_unitario > 0) score += 15;
  if (producto.sku) score += 10;
  if (producto.codigo_barras) score += 5;
  if (producto.stock_disponible !== undefined) score += 5;
  if (producto.nombre.length > 200) score -= 10;
  if (producto.precio_unitario < 1 || producto.precio_unitario > 100000) score -= 20;
  return Math.max(0, Math.min(100, score));
}

export async function generateContentHash(content: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(content);
    const buffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).substring(2, 15);
  }
}

export async function extractProductosConOptimizacion(
  html: string, categoria: string, urlBase: string, structuredLog: StructuredLog
): Promise<ProductoMaxiconsumo[]> {
  const productos: ProductoMaxiconsumo[] = [];
  const patterns = [
    /<div[^>]*class="[^"]*product[^"]*"[^>]*>.*?<h[2-6][^>]*>([^<]+)<\/h[2-6]>.*?<span[^>]*class="[^"]*precio[^"]*"[^>]*>[\s]*\$?([0-9]+(?:[.,][0-9]{2})?)[\s]*<\/span>.*?sku["'\s]*:?\s*["']?([^"'\s,>]+)["']?/gs,
    /<article[^>]*class="[^"]*product[^"]*"[^>]*>.*?<h[2-4][^>]*>([^<]+)<\/h[2-4]>.*?price["'\s]*:?\s*["']?\$?([0-9]+(?:[.,][0-9]{2})?)["']?.*?data-sku=["']?([^"'\s,>]+)["']?/gs,
    /<h[2-4][^>]*>([^<]+)<\/h[2-4]>.*?\$([0-9]+(?:[.,][0-9]{2})?)/gs
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(html)) !== null && productos.length < 1000) {
      try {
        const nombre = match[1].trim().replace(/&[a-zA-Z0-9#]+;/g, ' ');
        const precio = parseFloat(match[2].replace(/[^\d.,]/g, '').replace(',', '.'));
        const sku = match[3]?.trim() || generarSKU(nombre, categoria);

        if (nombre && precio > 0 && precio < 100000) {
          productos.push({
            sku,
            nombre: sanitizeProductName(nombre),
            marca: extraerMarcaDelNombre(nombre),
            categoria,
            precio_unitario: precio,
            url_producto: `${urlBase}producto/${encodeURIComponent(sku)}`,
            ultima_actualizacion: new Date().toISOString(),
            metadata: { extracted_by_pattern: patterns.indexOf(pattern), match_position: match.index }
          });
        }
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        logger.warn('PRODUCT_EXTRACTION_ERROR', { ...structuredLog, error: errorMessage });
      }
    }
    if (productos.length > 10) break;
  }
  return productos;
}

export function extraerProductosConRegex(html: string, categoria: string, urlBase: string): ProductoMaxiconsumo[] {
  const productos: ProductoMaxiconsumo[] = [];
  const pattern = /<div[^>]*class="[^"]*producto[^"]*"[^>]*>.*?<h3[^>]*>(.*?)<\/h3>.*?<span[^>]*class="precio[^"]*">.*?(\d+[\.,]\d+).*?<\/span>.*?sku["']?\s*:?\s*["']?([^"'\s]+)["']?.*?<\/div>/gs;

  let match;
  while ((match = pattern.exec(html)) !== null) {
    try {
      const nombre = match[1].trim();
      const precio = parseFloat(match[2].replace(',', '.'));
      const sku = match[3];
      if (nombre && precio > 0 && sku) {
        productos.push({
          sku, nombre, marca: extraerMarcaDelNombre(nombre), categoria,
          precio_unitario: precio, url_producto: `${urlBase}producto/${sku}`,
          ultima_actualizacion: new Date().toISOString()
        });
      }
    } catch { /* skip */ }
  }
  return productos.length > 0 ? productos : extraerProductosPatronAlternativo(html, categoria, urlBase);
}

function extraerProductosPatronAlternativo(html: string, categoria: string, urlBase: string): ProductoMaxiconsumo[] {
  const productos: ProductoMaxiconsumo[] = [];
  const pattern = /<h[2-6][^>]*>(.*?)<\/h[2-6]>.*?precio.*?(\d+[\.,]\d+)/gs;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    const nombre = match[1].trim();
    const precio = parseFloat(match[2].replace(',', '.'));
    if (nombre && precio > 0 && nombre.length > 3) {
      productos.push({
        sku: generarSKU(nombre, categoria), nombre, marca: extraerMarcaDelNombre(nombre),
        categoria, precio_unitario: precio, url_producto: `${urlBase}buscar?q=${encodeURIComponent(nombre)}`,
        ultima_actualizacion: new Date().toISOString()
      });
    }
  }
  return productos;
}
