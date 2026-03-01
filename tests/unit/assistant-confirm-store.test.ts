/**
 * Tests for confirm-store.ts — Sprint 2 token management
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createConfirmToken,
  consumeConfirmToken,
  _clearAll,
  _storeSize,
  type ActionPlan,
} from '../../supabase/functions/api-assistant/confirm-store';

const SAMPLE_PLAN: ActionPlan = {
  intent: 'crear_tarea',
  label: 'Crear tarea',
  payload: { titulo: 'Comprar harina', prioridad: 'normal' },
  summary: 'Crear tarea "Comprar harina" con prioridad normal',
  risk: 'bajo',
};

const USER_A = 'user-a-uuid';
const USER_B = 'user-b-uuid';

describe('confirm-store', () => {
  beforeEach(() => {
    _clearAll();
  });

  describe('createConfirmToken', () => {
    it('returns a string token', () => {
      const token = createConfirmToken(USER_A, SAMPLE_PLAN);
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(10);
    });

    it('creates unique tokens each time', () => {
      const t1 = createConfirmToken(USER_A, SAMPLE_PLAN);
      const t2 = createConfirmToken(USER_A, SAMPLE_PLAN);
      expect(t1).not.toBe(t2);
    });

    it('increments store size', () => {
      expect(_storeSize()).toBe(0);
      createConfirmToken(USER_A, SAMPLE_PLAN);
      expect(_storeSize()).toBe(1);
      createConfirmToken(USER_A, SAMPLE_PLAN);
      expect(_storeSize()).toBe(2);
    });
  });

  describe('consumeConfirmToken', () => {
    it('returns plan on valid consume', () => {
      const token = createConfirmToken(USER_A, SAMPLE_PLAN);
      const result = consumeConfirmToken(token, USER_A);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.plan.intent).toBe('crear_tarea');
        expect(result.plan.payload.titulo).toBe('Comprar harina');
      }
    });

    it('token is single-use (second consume fails)', () => {
      const token = createConfirmToken(USER_A, SAMPLE_PLAN);
      const first = consumeConfirmToken(token, USER_A);
      expect(first.ok).toBe(true);

      const second = consumeConfirmToken(token, USER_A);
      expect(second.ok).toBe(false);
      if (!second.ok) {
        expect(second.reason).toBe('NOT_FOUND');
      }
    });

    it('fails with NOT_FOUND for invalid token', () => {
      const result = consumeConfirmToken('nonexistent', USER_A);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('NOT_FOUND');
      }
    });

    it('fails with USER_MISMATCH for different user', () => {
      const token = createConfirmToken(USER_A, SAMPLE_PLAN);
      const result = consumeConfirmToken(token, USER_B);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe('USER_MISMATCH');
      }
      // Token is consumed even on mismatch (single-use)
      expect(_storeSize()).toBe(0);
    });

    it('removes token from store after consume', () => {
      const token = createConfirmToken(USER_A, SAMPLE_PLAN);
      expect(_storeSize()).toBe(1);
      consumeConfirmToken(token, USER_A);
      expect(_storeSize()).toBe(0);
    });
  });

  describe('different plans', () => {
    it('stores registrar_pago_cc plan correctly', () => {
      const pagoPlan: ActionPlan = {
        intent: 'registrar_pago_cc',
        label: 'Registrar pago',
        payload: { cliente_id: 'uuid-123', monto: 5000, cliente_nombre: 'Juan' },
        summary: 'Registrar pago de $5.000 para Juan',
        risk: 'medio',
      };
      const token = createConfirmToken(USER_A, pagoPlan);
      const result = consumeConfirmToken(token, USER_A);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.plan.intent).toBe('registrar_pago_cc');
        expect(result.plan.payload.monto).toBe(5000);
        expect(result.plan.risk).toBe('medio');
      }
    });
  });

  describe('concurrent tokens', () => {
    it('handles multiple active tokens for same user', () => {
      const t1 = createConfirmToken(USER_A, { ...SAMPLE_PLAN, payload: { titulo: 'Task 1' } });
      const t2 = createConfirmToken(USER_A, { ...SAMPLE_PLAN, payload: { titulo: 'Task 2' } });
      expect(_storeSize()).toBe(2);

      const r1 = consumeConfirmToken(t1, USER_A);
      expect(r1.ok).toBe(true);
      if (r1.ok) expect(r1.plan.payload.titulo).toBe('Task 1');

      const r2 = consumeConfirmToken(t2, USER_A);
      expect(r2.ok).toBe(true);
      if (r2.ok) expect(r2.plan.payload.titulo).toBe('Task 2');
    });
  });
});
