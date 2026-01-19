/**
 * Unit Tests for _shared/circuit-breaker.ts
 * 
 * Tests the CircuitBreaker pattern implementation:
 * - State transitions (closed → open → half_open → closed)
 * - Failure counting and threshold
 * - Success counting in half_open state
 * - Timeout-based state transitions
 * - Factory function and snapshot
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { 
  CircuitBreaker, 
  getCircuitBreaker, 
  getCircuitBreakersSnapshot,
  type CircuitState 
} from '../../supabase/functions/_shared/circuit-breaker';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    breaker = new CircuitBreaker({ 
      failureThreshold: 3, 
      successThreshold: 2, 
      openTimeoutMs: 5000 
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial State', () => {
    it('should start in closed state', () => {
      expect(breaker.getState()).toBe('closed');
    });

    it('should allow requests in closed state', () => {
      expect(breaker.allowRequest()).toBe(true);
    });

    it('should return correct initial stats', () => {
      const stats = breaker.getStats();
      expect(stats.state).toBe('closed');
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.openedAt).toBe(0);
    });
  });

  describe('Failure Handling', () => {
    it('should count failures', () => {
      breaker.recordFailure();
      expect(breaker.getStats().failures).toBe(1);
      
      breaker.recordFailure();
      expect(breaker.getStats().failures).toBe(2);
    });

    it('should open circuit after reaching failure threshold', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('closed');
      
      breaker.recordFailure(); // 3rd failure - threshold reached
      expect(breaker.getState()).toBe('open');
    });

    it('should not allow requests when open', () => {
      // Trip the breaker
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      
      expect(breaker.allowRequest()).toBe(false);
    });

    it('should record lastFailure timestamp', () => {
      const now = Date.now();
      breaker.recordFailure();
      expect(breaker.getStats().lastFailure).toBeGreaterThanOrEqual(now);
    });

    it('should ignore failures when already open', () => {
      // Trip the breaker
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      
      const failuresAtOpen = breaker.getStats().failures;
      
      // Try to record more failures
      breaker.recordFailure();
      breaker.recordFailure();
      
      // Failures should not increase
      expect(breaker.getStats().failures).toBe(failuresAtOpen);
    });
  });

  describe('Success Handling', () => {
    it('should reset failure count on success in closed state', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getStats().failures).toBe(2);
      
      breaker.recordSuccess();
      expect(breaker.getStats().failures).toBe(0);
    });
  });

  describe('Half-Open State', () => {
    it('should transition to half_open after timeout', () => {
      // Trip the breaker
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');
      
      // Advance time past timeout
      vi.advanceTimersByTime(5001);
      
      expect(breaker.getState()).toBe('half_open');
    });

    it('should allow requests in half_open state', () => {
      // Trip and wait
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      vi.advanceTimersByTime(5001);
      
      expect(breaker.allowRequest()).toBe(true);
    });

    it('should close after success threshold in half_open', () => {
      // Trip and wait
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      vi.advanceTimersByTime(5001);
      expect(breaker.getState()).toBe('half_open');
      
      // Record successes
      breaker.recordSuccess();
      expect(breaker.getState()).toBe('half_open');
      
      breaker.recordSuccess(); // 2nd success - threshold reached
      expect(breaker.getState()).toBe('closed');
    });

    it('should reopen on failure in half_open state', () => {
      // Trip and wait
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      vi.advanceTimersByTime(5001);
      expect(breaker.getState()).toBe('half_open');
      
      // Fail again - should reopen immediately (threshold is 3, starts at 0)
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      expect(breaker.getState()).toBe('open');
    });
  });

  describe('Reset', () => {
    it('should reset all state', () => {
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();
      
      breaker.reset();
      
      const stats = breaker.getStats();
      expect(stats.state).toBe('closed');
      expect(stats.failures).toBe(0);
      expect(stats.successes).toBe(0);
      expect(stats.openedAt).toBe(0);
    });
  });

  describe('Default Options', () => {
    it('should use default options when not provided', () => {
      const defaultBreaker = new CircuitBreaker();
      
      // Default: failureThreshold = 5
      for (let i = 0; i < 4; i++) {
        defaultBreaker.recordFailure();
      }
      expect(defaultBreaker.getState()).toBe('closed');
      
      defaultBreaker.recordFailure(); // 5th failure
      expect(defaultBreaker.getState()).toBe('open');
    });
  });
});

describe('getCircuitBreaker', () => {
  it('should return same instance for same key', () => {
    const breaker1 = getCircuitBreaker('test-service');
    const breaker2 = getCircuitBreaker('test-service');
    
    expect(breaker1).toBe(breaker2);
  });

  it('should return different instances for different keys', () => {
    const breaker1 = getCircuitBreaker('service-a');
    const breaker2 = getCircuitBreaker('service-b');
    
    expect(breaker1).not.toBe(breaker2);
  });
});

describe('getCircuitBreakersSnapshot', () => {
  it('should return snapshot of all circuit breakers', () => {
    // Create some breakers
    getCircuitBreaker('snapshot-test-1');
    getCircuitBreaker('snapshot-test-2');
    
    const snapshot = getCircuitBreakersSnapshot();
    
    expect(Array.isArray(snapshot)).toBe(true);
    expect(snapshot.length).toBeGreaterThanOrEqual(2);
    
    // Check structure
    const entry = snapshot.find(([key]) => key === 'snapshot-test-1');
    expect(entry).toBeDefined();
    if (entry) {
      const [key, stats] = entry;
      expect(key).toBe('snapshot-test-1');
      expect(stats).toHaveProperty('state');
      expect(stats).toHaveProperty('failures');
      expect(stats).toHaveProperty('successes');
    }
  });
});
