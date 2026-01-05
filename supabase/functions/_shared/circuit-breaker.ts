export type CircuitState = 'closed' | 'open' | 'half_open';

export type CircuitBreakerOptions = {
  failureThreshold: number;
  successThreshold: number;
  openTimeoutMs: number;
};

const DEFAULT_OPTIONS: CircuitBreakerOptions = {
  failureThreshold: 5,
  successThreshold: 2,
  openTimeoutMs: 30_000,
};

export class CircuitBreaker {
  private readonly options: CircuitBreakerOptions;
  private state: CircuitState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private openedAt = 0;
  private lastFailure = 0;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  getState(): CircuitState {
    if (this.state === 'open' && Date.now() - this.openedAt >= this.options.openTimeoutMs) {
      this.state = 'half_open';
      this.successCount = 0;
      this.failureCount = 0;
    }

    return this.state;
  }

  getStats(): { state: CircuitState; failures: number; successes: number; openedAt: number; lastFailure: number } {
    return {
      state: this.getState(),
      failures: this.failureCount,
      successes: this.successCount,
      openedAt: this.openedAt,
      lastFailure: this.lastFailure,
    };
  }

  allowRequest(): boolean {
    const state = this.getState();
    return state !== 'open';
  }

  recordSuccess(): void {
    const state = this.getState();
    if (state === 'half_open') {
      this.successCount += 1;
      if (this.successCount >= this.options.successThreshold) {
        this.reset();
      }
      return;
    }

    this.failureCount = 0;
  }

  recordFailure(): void {
    const state = this.getState();
    if (state === 'open') {
      return;
    }

    this.failureCount += 1;
    this.lastFailure = Date.now();
    if (this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
      this.openedAt = Date.now();
    }
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.openedAt = 0;
  }
}

const CIRCUIT_BREAKERS = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  key: string,
  options: Partial<CircuitBreakerOptions> = {},
): CircuitBreaker {
  const existing = CIRCUIT_BREAKERS.get(key);
  if (existing) {
    return existing;
  }

  const breaker = new CircuitBreaker(options);
  CIRCUIT_BREAKERS.set(key, breaker);
  return breaker;
}

export function getCircuitBreakersSnapshot(): Array<[string, ReturnType<CircuitBreaker['getStats']>]> {
  return Array.from(CIRCUIT_BREAKERS.entries()).map(([key, breaker]) => [key, breaker.getStats()]);
}
