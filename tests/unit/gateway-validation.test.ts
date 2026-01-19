/**
 * Unit Tests for api-minimarket/helpers/validation.ts
 * 
 * Tests input validation utilities:
 * - UUID validation
 * - Number parsing (positive, non-negative, integers)
 * - Text sanitization
 * - Boolean/Date parsing
 * - Field whitelisting
 */

import { describe, it, expect } from 'vitest';
import {
        isUuid,
        UUID_REGEX,
        parsePositiveNumber,
        parseNonNegativeNumber,
        parsePositiveInt,
        parseNonNegativeInt,
        sanitizeTextParam,
        parseBooleanParam,
        parseISODate,
        isValidMovimientoTipo,
        VALID_MOVIMIENTO_TIPOS,
        validateAllowedFields,
        PRODUCTO_UPDATE_FIELDS,
        isValidCodigo
} from '../../supabase/functions/api-minimarket/helpers/validation';

describe('UUID_REGEX and isUuid', () => {
        it('should match valid UUID v4', () => {
                expect(UUID_REGEX.test('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
                expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        });

        it('should be case-insensitive', () => {
                expect(isUuid('550E8400-E29B-41D4-A716-446655440000')).toBe(true);
                expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
        });

        it('should reject invalid UUIDs', () => {
                expect(isUuid('not-a-uuid')).toBe(false);
                expect(isUuid('550e8400-e29b-41d4-a716')).toBe(false); // Too short
                expect(isUuid('550e8400-e29b-41d4-a716-4466554400001')).toBe(false); // Too long
                expect(isUuid('550e8400-e29b-61d4-a716-446655440000')).toBe(false); // Wrong version
        });

        it('should handle null/undefined', () => {
                expect(isUuid(null)).toBe(false);
                expect(isUuid(undefined)).toBe(false);
        });

        it('should reject empty string', () => {
                expect(isUuid('')).toBe(false);
        });
});

describe('parsePositiveNumber', () => {
        it('should parse positive numbers', () => {
                expect(parsePositiveNumber('10')).toBe(10);
                expect(parsePositiveNumber('0.5')).toBe(0.5);
                expect(parsePositiveNumber(123)).toBe(123);
        });

        it('should reject zero', () => {
                expect(parsePositiveNumber('0')).toBeNull();
                expect(parsePositiveNumber(0)).toBeNull();
        });

        it('should reject negative numbers', () => {
                expect(parsePositiveNumber('-5')).toBeNull();
                expect(parsePositiveNumber(-10)).toBeNull();
        });

        it('should reject non-numeric values', () => {
                expect(parsePositiveNumber('abc')).toBeNull();
                expect(parsePositiveNumber(null)).toBeNull();
                expect(parsePositiveNumber(undefined)).toBeNull();
                expect(parsePositiveNumber({})).toBeNull();
        });

        it('should reject Infinity and NaN', () => {
                expect(parsePositiveNumber(Infinity)).toBeNull();
                expect(parsePositiveNumber(NaN)).toBeNull();
        });
});

describe('parseNonNegativeNumber', () => {
        it('should parse positive and zero', () => {
                expect(parseNonNegativeNumber('10')).toBe(10);
                expect(parseNonNegativeNumber('0')).toBe(0);
                expect(parseNonNegativeNumber(0)).toBe(0);
                expect(parseNonNegativeNumber('0.5')).toBe(0.5);
        });

        it('should reject negative numbers', () => {
                expect(parseNonNegativeNumber('-5')).toBeNull();
                expect(parseNonNegativeNumber(-0.1)).toBeNull();
        });
});

describe('parsePositiveInt', () => {
        it('should parse positive integers', () => {
                expect(parsePositiveInt('10')).toBe(10);
                expect(parsePositiveInt(5)).toBe(5);
        });

        it('should reject floats', () => {
                expect(parsePositiveInt('10.5')).toBeNull();
                expect(parsePositiveInt(3.14)).toBeNull();
        });

        it('should reject zero', () => {
                expect(parsePositiveInt('0')).toBeNull();
                expect(parsePositiveInt(0)).toBeNull();
        });
});

describe('parseNonNegativeInt', () => {
        it('should parse zero and positive integers', () => {
                expect(parseNonNegativeInt('0')).toBe(0);
                expect(parseNonNegativeInt('10')).toBe(10);
                expect(parseNonNegativeInt(0)).toBe(0);
        });

        it('should reject floats', () => {
                expect(parseNonNegativeInt('0.5')).toBeNull();
                expect(parseNonNegativeInt(1.5)).toBeNull();
        });

        it('should reject negative', () => {
                expect(parseNonNegativeInt('-1')).toBeNull();
        });
});

describe('sanitizeTextParam', () => {
        it('should preserve alphanumeric', () => {
                expect(sanitizeTextParam('Hello123')).toBe('Hello123');
        });

        it('should preserve spaces, underscores, dots, hyphens', () => {
                expect(sanitizeTextParam('hello_world.test-123')).toBe('hello_world.test-123');
                expect(sanitizeTextParam('hello world')).toBe('hello world');
        });

        it('should remove special characters', () => {
                expect(sanitizeTextParam('hello@world!')).toBe('helloworld');
                expect(sanitizeTextParam('test<script>')).toBe('testscript');
        });

        it('should trim whitespace', () => {
                expect(sanitizeTextParam('  hello  ')).toBe('hello');
        });
});

describe('parseBooleanParam', () => {
        it('should parse true', () => {
                expect(parseBooleanParam('true')).toBe(true);
        });

        it('should parse false', () => {
                expect(parseBooleanParam('false')).toBe(false);
        });

        it('should return null for other values', () => {
                expect(parseBooleanParam('yes')).toBeNull();
                expect(parseBooleanParam('1')).toBeNull();
                expect(parseBooleanParam('TRUE')).toBeNull(); // Case-sensitive
        });

        it('should return null for null input', () => {
                expect(parseBooleanParam(null)).toBeNull();
        });
});

describe('parseISODate', () => {
        it('should parse valid ISO date', () => {
                const date = parseISODate('2024-01-15T10:30:00Z');

                expect(date).toBeInstanceOf(Date);
                expect(date?.toISOString()).toBe('2024-01-15T10:30:00.000Z');
        });

        it('should parse date without time', () => {
                const date = parseISODate('2024-01-15');

                expect(date).toBeInstanceOf(Date);
        });

        it('should return null for invalid date', () => {
                expect(parseISODate('not-a-date')).toBeNull();
                expect(parseISODate('2024-13-45')).toBeNull(); // Invalid month/day
        });

        it('should return null for null input', () => {
                expect(parseISODate(null)).toBeNull();
        });

        it('should return null for empty string', () => {
                expect(parseISODate('')).toBeNull();
        });
});

describe('isValidMovimientoTipo', () => {
        it('should accept valid movement types', () => {
                expect(isValidMovimientoTipo('entrada')).toBe(true);
                expect(isValidMovimientoTipo('salida')).toBe(true);
                expect(isValidMovimientoTipo('ajuste')).toBe(true);
                expect(isValidMovimientoTipo('transferencia')).toBe(true);
        });

        it('should be case-insensitive', () => {
                expect(isValidMovimientoTipo('ENTRADA')).toBe(true);
                expect(isValidMovimientoTipo('Salida')).toBe(true);
        });

        it('should reject invalid types', () => {
                expect(isValidMovimientoTipo('ingreso')).toBe(false);
                expect(isValidMovimientoTipo('egreso')).toBe(false);
                expect(isValidMovimientoTipo('')).toBe(false);
        });
});

describe('VALID_MOVIMIENTO_TIPOS', () => {
        it('should have exactly 4 types', () => {
                expect(VALID_MOVIMIENTO_TIPOS.size).toBe(4);
        });
});

describe('validateAllowedFields', () => {
        it('should return valid for allowed fields only', () => {
                const obj = { sku: 'ABC', nombre: 'Test' };
                const result = validateAllowedFields(obj, PRODUCTO_UPDATE_FIELDS);

                expect(result.valid).toBe(true);
                expect(result.unknownFields).toEqual([]);
        });

        it('should return invalid with unknown fields', () => {
                const obj = { sku: 'ABC', unknown_field: 'test', another: 123 };
                const result = validateAllowedFields(obj, PRODUCTO_UPDATE_FIELDS);

                expect(result.valid).toBe(false);
                expect(result.unknownFields).toContain('unknown_field');
                expect(result.unknownFields).toContain('another');
        });

        it('should handle empty object', () => {
                const result = validateAllowedFields({}, PRODUCTO_UPDATE_FIELDS);

                expect(result.valid).toBe(true);
                expect(result.unknownFields).toEqual([]);
        });
});

describe('PRODUCTO_UPDATE_FIELDS', () => {
        it('should contain expected fields', () => {
                expect(PRODUCTO_UPDATE_FIELDS.has('sku')).toBe(true);
                expect(PRODUCTO_UPDATE_FIELDS.has('nombre')).toBe(true);
                expect(PRODUCTO_UPDATE_FIELDS.has('precio_actual')).toBe(true);
                expect(PRODUCTO_UPDATE_FIELDS.has('activo')).toBe(true);
        });

        it('should not contain sensitive fields', () => {
                expect(PRODUCTO_UPDATE_FIELDS.has('id')).toBe(false);
                expect(PRODUCTO_UPDATE_FIELDS.has('created_at')).toBe(false);
                expect(PRODUCTO_UPDATE_FIELDS.has('user_id')).toBe(false);
        });
});

describe('isValidCodigo', () => {
        it('should accept alphanumeric with hyphens/underscores', () => {
                expect(isValidCodigo('ABC-123')).toBe(true);
                expect(isValidCodigo('SKU_001')).toBe(true);
                expect(isValidCodigo('producto123')).toBe(true);
        });

        it('should reject special characters', () => {
                expect(isValidCodigo('ABC 123')).toBe(false); // Space
                expect(isValidCodigo('ABC.123')).toBe(false); // Dot
                expect(isValidCodigo('ABC@123')).toBe(false);
        });

        it('should reject empty string', () => {
                expect(isValidCodigo('')).toBe(false);
        });
});
