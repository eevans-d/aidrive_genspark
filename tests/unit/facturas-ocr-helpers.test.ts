import { describe, it, expect } from 'vitest';
import {
  parseArgentineNumber,
  normalizeUnit,
  normalizeText,
  parsePackSize,
  calculateUnitCost,
  crossValidateSubtotal,
  enhanceLineItem,
  parseOcrText,
  extractCuit,
  DEFAULT_SUPPLIER_PROFILE,
  canExtractFacturaOCR,
  VALID_FACTURA_OCR_EXTRAER_ESTADOS,
  resolveOcrFeatureType,
} from '../../supabase/functions/facturas-ocr/helpers';
import type { SupplierProfile, OcrLineItem } from '../../supabase/functions/facturas-ocr/helpers';

// ============================================================
// parseArgentineNumber
// ============================================================
describe('parseArgentineNumber', () => {
  it('parses integer', () => {
    expect(parseArgentineNumber('100')).toBe(100);
  });

  it('parses Argentine decimal format (comma)', () => {
    expect(parseArgentineNumber('1.234,56')).toBe(1234.56);
  });

  it('parses thousands separator only', () => {
    expect(parseArgentineNumber('12.345')).toBe(12345);
  });

  it('parses simple decimal', () => {
    expect(parseArgentineNumber('99,99')).toBe(99.99);
  });

  it('returns null for empty string', () => {
    expect(parseArgentineNumber('')).toBeNull();
  });

  it('returns null for non-numeric', () => {
    expect(parseArgentineNumber('abc')).toBeNull();
  });

  it('handles large numbers', () => {
    expect(parseArgentineNumber('1.000.000,50')).toBe(1000000.5);
  });
});

// ============================================================
// normalizeUnit
// ============================================================
describe('normalizeUnit', () => {
  it('normalizes unit variants to canonical forms', () => {
    expect(normalizeUnit('kg')).toBe('kg');
    expect(normalizeUnit('kgs')).toBe('kg');
    expect(normalizeUnit('Kilo')).toBe('kg');
    expect(normalizeUnit('kilos')).toBe('kg');
  });

  it('normalizes liters', () => {
    expect(normalizeUnit('lt')).toBe('lt');
    expect(normalizeUnit('l')).toBe('lt');
    expect(normalizeUnit('lts')).toBe('lt');
    expect(normalizeUnit('litro')).toBe('lt');
    expect(normalizeUnit('litros')).toBe('lt');
  });

  it('normalizes units to u', () => {
    expect(normalizeUnit('u')).toBe('u');
    expect(normalizeUnit('un')).toBe('u');
    expect(normalizeUnit('uni')).toBe('u');
    expect(normalizeUnit('unid')).toBe('u');
    expect(normalizeUnit('unidad')).toBe('u');
    expect(normalizeUnit('unidades')).toBe('u');
  });

  it('normalizes pack', () => {
    expect(normalizeUnit('paq')).toBe('paq');
    expect(normalizeUnit('pack')).toBe('paq');
  });

  it('normalizes caja variants', () => {
    expect(normalizeUnit('cja')).toBe('caja');
    expect(normalizeUnit('caj')).toBe('caja');
    expect(normalizeUnit('caja')).toBe('caja');
    expect(normalizeUnit('cajas')).toBe('caja');
  });

  it('strips trailing period', () => {
    expect(normalizeUnit('kg.')).toBe('kg');
  });

  it('returns unknown units as-is (lowercased)', () => {
    expect(normalizeUnit('mt')).toBe('mt');
  });
});

// ============================================================
// normalizeText
// ============================================================
describe('normalizeText', () => {
  it('lowercases', () => {
    expect(normalizeText('CAFE MOLIDO')).toBe('cafe molido');
  });

  it('removes accents', () => {
    expect(normalizeText('Café con Leche')).toBe('cafe con leche');
  });

  it('removes special characters', () => {
    expect(normalizeText('Coca-Cola® 500ml')).toBe('cocacola 500ml');
  });

  it('trims whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });
});

// ============================================================
// parsePackSize
// ============================================================
describe('parsePackSize', () => {
  it('extracts NxM pattern', () => {
    expect(parsePackSize('TALLARIN DON VICENTE 20X500')).toBe(20);
  });

  it('extracts AxBxC pattern (triple)', () => {
    expect(parsePackSize('GALLETITAS 12X3X250')).toBe(36); // 12*3
  });

  it('returns null for no pack pattern', () => {
    expect(parsePackSize('COCA COLA 500ML')).toBeNull();
  });

  it('returns null for single number', () => {
    expect(parsePackSize('ARROZ 1KG')).toBeNull();
  });

  it('handles lowercase x', () => {
    expect(parsePackSize('FIDEOS 10x500')).toBe(10);
  });

  it('handles pack count = 2 (minimum)', () => {
    expect(parsePackSize('ITEM 2X100')).toBe(2);
  });

  it('returns null if first number is less than 2', () => {
    expect(parsePackSize('ITEM 1X500')).toBeNull();
  });
});

// ============================================================
// calculateUnitCost
// ============================================================
describe('calculateUnitCost', () => {
  const defaultProfile: SupplierProfile = {
    precio_es_bulto: true,
    iva_incluido: false,
    iva_tasa: 0.21,
  };

  it('calculates unit cost with IVA 21% for bulk price', () => {
    // 1000 / 20 = 50 neto, 50 * 1.21 = 60.50
    const result = calculateUnitCost(1000, 20, defaultProfile);
    expect(result).toBe(60.5);
  });

  it('calculates without IVA when iva_incluido is true', () => {
    const profile = { ...defaultProfile, iva_incluido: true };
    // 1000 / 20 = 50 (no IVA adjustment)
    const result = calculateUnitCost(1000, 20, profile);
    expect(result).toBe(50);
  });

  it('handles single unit (no pack)', () => {
    const result = calculateUnitCost(100, 1, defaultProfile);
    // 100 * 1.21 = 121
    expect(result).toBe(121);
  });

  it('rounds to 4 decimal places', () => {
    const result = calculateUnitCost(100, 3, defaultProfile);
    // 100/3 = 33.3333... * 1.21 = 40.3333...
    expect(result).toBe(40.3333);
  });
});

// ============================================================
// crossValidateSubtotal
// ============================================================
describe('crossValidateSubtotal', () => {
  it('returns ok when deviation <= 0.5%', () => {
    const result = crossValidateSubtotal(10, 100, 1000);
    expect(result.status).toBe('ok');
    expect(result.deviation).toBe(0);
  });

  it('returns warning when deviation between 0.5% and 2%', () => {
    // 10 * 100 = 1000 vs 990 → deviation = 10/990 ≈ 1.01%
    const result = crossValidateSubtotal(10, 100, 990);
    expect(result.status).toBe('warning');
  });

  it('returns error when deviation > 2%', () => {
    // 10 * 100 = 1000 vs 900 → deviation = 100/900 ≈ 11.1%
    const result = crossValidateSubtotal(10, 100, 900);
    expect(result.status).toBe('error');
  });

  it('returns null when subtotal is null', () => {
    const result = crossValidateSubtotal(10, 100, null);
    expect(result.status).toBeNull();
    expect(result.deviation).toBeNull();
  });

  it('returns null when precioUnitario is null', () => {
    const result = crossValidateSubtotal(10, null, 1000);
    expect(result.status).toBeNull();
  });

  it('returns null when subtotal is 0', () => {
    const result = crossValidateSubtotal(10, 100, 0);
    expect(result.status).toBeNull();
  });
});

// ============================================================
// enhanceLineItem
// ============================================================
describe('enhanceLineItem', () => {
  const defaultProfile = DEFAULT_SUPPLIER_PROFILE;

  it('enhances item with pack size and unit cost', () => {
    const item: OcrLineItem = {
      descripcion: 'TALLARIN DON VICENTE 20X500',
      cantidad: 5,
      unidad: 'u',
      precio_unitario: 2000,
      subtotal: 10000,
    };

    const result = enhanceLineItem(item, defaultProfile);

    expect(result.unidades_por_bulto).toBe(20);
    expect(result.precio_unitario_costo).toBeDefined();
    expect(result.precio_unitario_costo).toBeGreaterThan(0);
    expect(result.validacion_subtotal).toBe('ok');
    expect(result.notas_calculo).toContain('Pack 20u');
    expect(result.notas_calculo).toContain('+IVA 21%');
  });

  it('handles item without pack size', () => {
    const item: OcrLineItem = {
      descripcion: 'ARROZ GALLO 1KG',
      cantidad: 3,
      unidad: 'u',
      precio_unitario: 500,
      subtotal: 1500,
    };

    const result = enhanceLineItem(item, defaultProfile);

    expect(result.unidades_por_bulto).toBeNull();
    // Unit cost = 500 * 1.21 = 605
    expect(result.precio_unitario_costo).toBe(605);
    expect(result.validacion_subtotal).toBe('ok');
  });

  it('handles null precio_unitario', () => {
    const item: OcrLineItem = {
      descripcion: 'PRODUCTO SIN PRECIO',
      cantidad: 1,
      unidad: 'u',
      precio_unitario: null,
      subtotal: null,
    };

    const result = enhanceLineItem(item, defaultProfile);

    expect(result.precio_unitario_costo).toBeNull();
    expect(result.notas_calculo).toBeNull();
  });

  it('uses IVA incluido profile', () => {
    const profile: SupplierProfile = {
      precio_es_bulto: false,
      iva_incluido: true,
      iva_tasa: 0.21,
    };

    const item: OcrLineItem = {
      descripcion: 'ACEITE COCINERO 1LT',
      cantidad: 2,
      unidad: 'lt',
      precio_unitario: 800,
      subtotal: 1600,
    };

    const result = enhanceLineItem(item, profile);

    // precio_es_bulto = false, iva_incluido = true → precioUnitarioCosto = 800
    expect(result.precio_unitario_costo).toBe(800);
    expect(result.notas_calculo).toBe('Precio unitario (IVA incluido)');
  });
});

// ============================================================
// parseOcrText
// ============================================================
describe('parseOcrText', () => {
  describe('Invoice Number Extraction', () => {
    it('extracts "Nro" format', () => {
      const result = parseOcrText('Nro: 0001-12345678\nAlgo mas');
      expect(result.numero).toBe('0001-12345678');
    });

    it('extracts "Factura" format', () => {
      const result = parseOcrText('Factura A0001-00056789');
      expect(result.numero).toBe('A0001-00056789');
    });

    it('extracts "Comp" format', () => {
      const result = parseOcrText('Comp. 0002-00012345');
      expect(result.numero).toBe('0002-00012345');
    });

    it('returns null when no number found', () => {
      const result = parseOcrText('Texto sin numero de factura');
      expect(result.numero).toBeNull();
    });
  });

  describe('Date Extraction', () => {
    it('extracts DD/MM/YYYY', () => {
      const result = parseOcrText('Fecha: 15/02/2026');
      expect(result.fecha).toBe('2026-02-15');
    });

    it('extracts DD-MM-YY', () => {
      const result = parseOcrText('Fecha: 15-02-26');
      expect(result.fecha).toBe('2026-02-15');
    });

    it('extracts DD.MM.YYYY', () => {
      const result = parseOcrText('Fecha: 5.1.2026');
      expect(result.fecha).toBe('2026-01-05');
    });

    it('returns null when no date found', () => {
      const result = parseOcrText('Sin fecha aqui');
      expect(result.fecha).toBeNull();
    });
  });

  describe('Total Extraction', () => {
    it('extracts TOTAL with peso sign', () => {
      const result = parseOcrText('TOTAL $ 12.345,67');
      expect(result.total).toBe(12345.67);
    });

    it('extracts Total with colon', () => {
      const result = parseOcrText('Total: 5.000');
      expect(result.total).toBe(5000);
    });

    it('returns null when no total found', () => {
      const result = parseOcrText('Sin total');
      expect(result.total).toBeNull();
    });
  });

  describe('Comprobante Type Detection', () => {
    it('detects factura', () => {
      const result = parseOcrText('FACTURA A\nContenido');
      expect(result.tipo_comprobante).toBe('factura');
    });

    it('detects remito', () => {
      const result = parseOcrText('REMITO\nContenido');
      expect(result.tipo_comprobante).toBe('remito');
    });

    it('detects nota de credito', () => {
      const result = parseOcrText('NOTA DE CREDITO\nContenido');
      expect(result.tipo_comprobante).toBe('nota_credito');
    });

    it('detects recibo', () => {
      const result = parseOcrText('RECIBO\nContenido');
      expect(result.tipo_comprobante).toBe('recibo');
    });

    it('defaults to factura when unknown', () => {
      const result = parseOcrText('Documento generico');
      expect(result.tipo_comprobante).toBe('factura');
    });
  });

  describe('Line Item Extraction', () => {
    it('extracts items from typical invoice text', () => {
      const text = [
        'FACTURA A',
        'Nro: 0001-12345678',
        'Fecha: 15/02/2026',
        '',
        '5 kg Cafe Molido 1.500 7.500',
        '10 Azucar 800 8.000',
        '',
        'TOTAL $ 15.500',
      ].join('\n');

      const result = parseOcrText(text);

      expect(result.numero).toBe('0001-12345678');
      expect(result.fecha).toBe('2026-02-15');
      expect(result.total).toBe(15500);
      expect(result.tipo_comprobante).toBe('factura');
      expect(result.items.length).toBeGreaterThanOrEqual(1);
      expect(result.confianza).toBe(0.7);
    });

    it('returns confianza 0.3 when no items found', () => {
      const result = parseOcrText('Solo texto sin items');
      expect(result.items).toEqual([]);
      expect(result.confianza).toBe(0.3);
    });
  });

  describe('Full Text Preservation', () => {
    it('preserves the full raw text', () => {
      const text = 'FACTURA A\nLinea 1\nLinea 2';
      const result = parseOcrText(text);
      expect(result.texto_completo).toBe(text);
    });
  });

  describe('CUIT detection via parseOcrText', () => {
    it('populates proveedor_detectado when CUIT label is present', () => {
      const text = 'FACTURA A\nCUIT: 30-12345678-9\nNro: 0001-00001\nTOTAL $ 100';
      const result = parseOcrText(text);
      expect(result.proveedor_detectado).toBe('30-12345678-9');
    });

    it('leaves proveedor_detectado null when no CUIT in text', () => {
      const text = 'FACTURA A\nSin numero de CUIT\nTOTAL $ 100';
      const result = parseOcrText(text);
      expect(result.proveedor_detectado).toBeNull();
    });
  });
});

// ============================================================
// extractCuit
// ============================================================
describe('extractCuit', () => {
  it('parses labeled CUIT with dashes: "CUIT: 30-12345678-9"', () => {
    expect(extractCuit('Empresa SA\nCUIT: 30-12345678-9\nDirección: Calle 123')).toBe('30-12345678-9');
  });

  it('parses labeled CUIT with dots: "C.U.I.T.: 30.12345678.9"', () => {
    expect(extractCuit('C.U.I.T.: 30.12345678.9')).toBe('30-12345678-9');
  });

  it('parses "CUIT Nº 30-12345678-9"', () => {
    expect(extractCuit('CUIT Nº 30-12345678-9')).toBe('30-12345678-9');
  });

  it('parses "CUIT# 20-98765432-1"', () => {
    expect(extractCuit('CUIT# 20-98765432-1')).toBe('20-98765432-1');
  });

  it('parses labeled CUIT without separator: "CUIT 30 12345678 9"', () => {
    expect(extractCuit('CUIT 30 12345678 9')).toBe('30-12345678-9');
  });

  it('parses unlabeled CUIT with dashes as fallback', () => {
    expect(extractCuit('Emitido por 30-98765432-1 según normas AFIP')).toBe('30-98765432-1');
  });

  it('parses unlabeled CUIT with dots as fallback', () => {
    expect(extractCuit('Responsable Inscripto 27.12345678.5')).toBe('27-12345678-5');
  });

  it('returns null when no CUIT present', () => {
    expect(extractCuit('Factura sin número de CUIT')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractCuit('')).toBeNull();
  });
});

// ============================================================
// OCR runtime helpers
// ============================================================
describe('canExtractFacturaOCR', () => {
  it('allows pendiente and error estados', () => {
    expect(canExtractFacturaOCR('pendiente')).toBe(true);
    expect(canExtractFacturaOCR('error')).toBe(true);
  });

  it('rejects unsupported estados', () => {
    expect(canExtractFacturaOCR('extraida')).toBe(false);
    expect(canExtractFacturaOCR('validada')).toBe(false);
    expect(canExtractFacturaOCR('aplicada')).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(canExtractFacturaOCR(null)).toBe(false);
    expect(canExtractFacturaOCR(undefined)).toBe(false);
    expect(canExtractFacturaOCR(123)).toBe(false);
  });
});

describe('VALID_FACTURA_OCR_EXTRAER_ESTADOS', () => {
  it('contains exactly pending and error', () => {
    expect(VALID_FACTURA_OCR_EXTRAER_ESTADOS.has('pendiente')).toBe(true);
    expect(VALID_FACTURA_OCR_EXTRAER_ESTADOS.has('error')).toBe(true);
    expect(VALID_FACTURA_OCR_EXTRAER_ESTADOS.size).toBe(2);
  });
});

describe('resolveOcrFeatureType', () => {
  it('resolves PDF to DOCUMENT_TEXT_DETECTION', () => {
    expect(resolveOcrFeatureType('application/pdf', 'factura.pdf')).toBe('DOCUMENT_TEXT_DETECTION');
    expect(resolveOcrFeatureType('application/octet-stream', 'factura.PDF')).toBe('DOCUMENT_TEXT_DETECTION');
  });

  it('resolves images to TEXT_DETECTION', () => {
    expect(resolveOcrFeatureType('image/png', 'factura.png')).toBe('TEXT_DETECTION');
    expect(resolveOcrFeatureType('', 'factura.jpeg')).toBe('TEXT_DETECTION');
  });

  it('returns null for unsupported file types', () => {
    expect(resolveOcrFeatureType('text/plain', 'factura.txt')).toBeNull();
    expect(resolveOcrFeatureType(null, 'factura.sin_extension')).toBeNull();
  });
});
