/**
 * Tests para validators de cron-jobs-maxiconsumo
 * @module tests/unit/cron-validators.test
 */

import { describe, it, expect } from 'vitest';

// Imports reales de los validadores
import {
  ValidationError,
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidUrl,
  isValidISODate,
  isValidUUID,
  validateJobContext,
  validateEnvVars,
  validateCronJobConfig,
  validateJobResult,
  validateAlertaInput,
  validateComparacionInput,
  safeValidate,
} from '../../supabase/functions/cron-jobs-maxiconsumo/validators.ts';

describe('Validadores primitivos', () => {
  describe('isNonEmptyString', () => {
    it('retorna true para strings no vacíos', () => {
      expect(isNonEmptyString('hello')).toBe(true);
      expect(isNonEmptyString('  x  ')).toBe(true);
    });

    it('retorna false para valores inválidos', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString(null)).toBe(false);
      expect(isNonEmptyString(undefined)).toBe(false);
      expect(isNonEmptyString(123)).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('retorna true para números positivos', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(0.001)).toBe(true);
      expect(isPositiveNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('retorna false para valores inválidos', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
      expect(isPositiveNumber(Infinity)).toBe(false);
      expect(isPositiveNumber('1')).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('retorna true para números >= 0', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(100)).toBe(true);
    });

    it('retorna false para valores inválidos', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber(NaN)).toBe(false);
    });
  });

  describe('isValidUrl', () => {
    it('retorna true para URLs válidas', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://abc.supabase.co/functions/v1')).toBe(true);
    });

    it('retorna false para valores inválidos', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl(null)).toBe(false);
    });
  });

  describe('isValidISODate', () => {
    it('retorna true para fechas ISO válidas', () => {
      expect(isValidISODate('2025-01-23T10:00:00Z')).toBe(true);
      expect(isValidISODate('2025-01-23')).toBe(true);
      expect(isValidISODate(new Date().toISOString())).toBe(true);
    });

    it('retorna false para valores inválidos', () => {
      expect(isValidISODate('not-a-date')).toBe(false);
      expect(isValidISODate('')).toBe(false);
      expect(isValidISODate(null)).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('retorna true para UUIDs válidos', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('retorna false para valores inválidos', () => {
      expect(isValidUUID('not-a-uuid')).toBe(false);
      expect(isValidUUID('123-456-789')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });
});

describe('validateJobContext', () => {
  const validContext = {
    executionId: 'exec-123',
    jobId: 'job-daily',
    runId: 'run-abc',
    requestId: 'req-xyz',
    startTime: new Date(),
    source: 'scheduled' as const,
    parameters: { threshold: 15 },
  };

  it('pasa con contexto válido', () => {
    expect(() => validateJobContext(validContext)).not.toThrow();
  });

  it('falla con executionId vacío', () => {
    expect(() => validateJobContext({ ...validContext, executionId: '' }))
      .toThrow(ValidationError);
  });

  it('falla con source inválido', () => {
    expect(() => validateJobContext({ ...validContext, source: 'invalid' }))
      .toThrow(/must be one of/);
  });

  it('falla con parameters no objeto', () => {
    expect(() => validateJobContext({ ...validContext, parameters: 'invalid' }))
      .toThrow(ValidationError);
  });

  it('falla con null', () => {
    expect(() => validateJobContext(null)).toThrow(ValidationError);
  });
});

describe('validateEnvVars', () => {
  it('pasa con URL y key válidas', () => {
    expect(() => validateEnvVars('https://example.supabase.co', 'secret-key'))
      .not.toThrow();
  });

  it('falla con URL inválida', () => {
    expect(() => validateEnvVars('not-a-url', 'secret-key'))
      .toThrow(/supabaseUrl/);
  });

  it('falla con key vacía', () => {
    expect(() => validateEnvVars('https://example.com', ''))
      .toThrow(/serviceRoleKey/);
  });
});

describe('validateCronJobConfig', () => {
  const validConfig = {
    jobId: 'daily-price-update',
    name: 'Actualización diaria de precios',
    type: 'diario' as const,
    cronExpression: '0 6 * * *',
    priority: 1,
    timeoutMs: 300000,
    maxRetries: 3,
    circuitBreakerThreshold: 5,
    active: true,
    parameters: {},
    notificationChannels: ['email', 'slack'],
  };

  it('pasa con config válida', () => {
    expect(() => validateCronJobConfig(validConfig)).not.toThrow();
  });

  it('falla con tipo inválido', () => {
    expect(() => validateCronJobConfig({ ...validConfig, type: 'invalid' }))
      .toThrow(/must be one of/);
  });

  it('falla con priority fuera de rango', () => {
    expect(() => validateCronJobConfig({ ...validConfig, priority: 15 }))
      .toThrow(/priority/);
  });

  it('falla con active no booleano', () => {
    expect(() => validateCronJobConfig({ ...validConfig, active: 'true' }))
      .toThrow(/active/);
  });
});

describe('validateJobResult', () => {
  const validResult = {
    success: true,
    executionTimeMs: 1500,
    productsProcessed: 100,
    productsSuccessful: 95,
    productsFailed: 5,
    alertsGenerated: 10,
    emailsSent: 2,
    smsSent: 0,
    metrics: { scraped: 100 },
    errors: [],
    warnings: ['warning1'],
    recommendations: ['rec1'],
  };

  it('pasa con resultado válido', () => {
    expect(() => validateJobResult(validResult)).not.toThrow();
  });

  it('falla con success no booleano', () => {
    expect(() => validateJobResult({ ...validResult, success: 'true' }))
      .toThrow(/success/);
  });

  it('falla con executionTimeMs negativo', () => {
    expect(() => validateJobResult({ ...validResult, executionTimeMs: -1 }))
      .toThrow(/executionTimeMs/);
  });

  it('falla con errors no array', () => {
    expect(() => validateJobResult({ ...validResult, errors: 'error' }))
      .toThrow(/errors/);
  });
});

describe('validateAlertaInput', () => {
  const validAlerta = {
    producto_id: 'prod-123',
    tipo_cambio: 'aumento' as const,
    valor_anterior: 100,
    valor_nuevo: 120,
    porcentaje_cambio: 20,
    severidad: 'alta' as const,
    mensaje: 'Producto X aumentó 20%',
    fecha_alerta: new Date().toISOString(),
  };

  it('pasa con alerta válida', () => {
    expect(() => validateAlertaInput(validAlerta)).not.toThrow();
  });

  it('falla con tipo_cambio inválido', () => {
    expect(() => validateAlertaInput({ ...validAlerta, tipo_cambio: 'otro' }))
      .toThrow(/tipo_cambio/);
  });

  it('falla con severidad inválida', () => {
    expect(() => validateAlertaInput({ ...validAlerta, severidad: 'extrema' }))
      .toThrow(/severidad/);
  });

  it('falla con fecha_alerta inválida', () => {
    expect(() => validateAlertaInput({ ...validAlerta, fecha_alerta: 'invalid' }))
      .toThrow(/fecha_alerta/);
  });
});

describe('validateComparacionInput', () => {
  const validComp = {
    producto_id: 'prod-456',
    precio_actual: 150,
    precio_proveedor: 140,
  };

  it('pasa con comparación válida', () => {
    expect(() => validateComparacionInput(validComp)).not.toThrow();
  });

  it('falla con producto_id vacío', () => {
    expect(() => validateComparacionInput({ ...validComp, producto_id: '' }))
      .toThrow(/producto_id/);
  });

  it('falla con precio_actual negativo', () => {
    expect(() => validateComparacionInput({ ...validComp, precio_actual: -10 }))
      .toThrow(/precio_actual/);
  });
});

describe('safeValidate', () => {
  it('retorna success:true para input válido', () => {
    const result = safeValidate(
      { producto_id: 'x', precio_actual: 100, precio_proveedor: 90 },
      validateComparacionInput
    );
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.producto_id).toBe('x');
    }
  });

  it('retorna success:false para input inválido', () => {
    const result = safeValidate(
      { producto_id: '', precio_actual: 100, precio_proveedor: 90 },
      validateComparacionInput
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeInstanceOf(ValidationError);
    }
  });
});

describe('ValidationError', () => {
  it('tiene propiedades correctas', () => {
    const error = new ValidationError('field', 'must be string', 123);
    expect(error.name).toBe('ValidationError');
    expect(error.field).toBe('field');
    expect(error.reason).toBe('must be string');
    expect(error.value).toBe(123);
    expect(error.message).toContain('field');
    expect(error.message).toContain('must be string');
  });
});
