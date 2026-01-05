type RateLimitState = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export class FixedWindowRateLimiter {
  private readonly max: number;
  private readonly windowMs: number;
  private readonly buckets = new Map<string, RateLimitState>();

  constructor(max: number, windowMs: number) {
    this.max = max;
    this.windowMs = windowMs;
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const current = this.buckets.get(key);

    if (!current || now >= current.resetAt) {
      const resetAt = now + this.windowMs;
      this.buckets.set(key, { count: 1, resetAt });
      return { allowed: true, remaining: this.max - 1, resetAt };
    }

    if (current.count >= this.max) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.count += 1;
    this.buckets.set(key, current);
    return { allowed: true, remaining: this.max - current.count, resetAt: current.resetAt };
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }
}

type AdaptiveRateLimiterOptions = {
  initialRate?: number;
  maxRate?: number;
  minRate?: number;
  errorThreshold?: number;
  windowMs?: number;
  baseRate?: number;
  burstRate?: number;
  adaptiveFactor?: number;
  decreaseFactor?: number;
  increaseFactor?: number;
};

export class AdaptiveRateLimiter {
  private requests: number[] = [];
  private currentRate: number;
  private readonly maxRate: number;
  private readonly minRate: number;
  private readonly errorThreshold: number;
  private readonly windowMs: number;
  private readonly decreaseFactor: number;
  private readonly increaseFactor: number;

  constructor(options: AdaptiveRateLimiterOptions = {}) {
    const initialRate = options.initialRate ?? options.baseRate ?? 10;
    const maxRate = options.maxRate ?? options.burstRate ?? 50;
    const minRate = options.minRate ?? 1;

    this.maxRate = maxRate;
    this.minRate = minRate;
    this.currentRate = Math.min(maxRate, Math.max(minRate, initialRate));
    this.errorThreshold = options.errorThreshold ?? 0.1;
    this.windowMs = options.windowMs ?? 60000;
    this.decreaseFactor = options.decreaseFactor ?? options.adaptiveFactor ?? 0.8;
    this.increaseFactor = options.increaseFactor ?? 1.1;
  }

  tryAcquire(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    if (this.requests.length >= this.currentRate) {
      return false;
    }
    this.requests.push(now);
    return true;
  }

  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.currentRate) {
      const oldest = this.requests[0];
      const waitTime = Math.max(this.windowMs - (now - oldest), 0);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    this.requests.push(Date.now());
  }

  adjust(errorRate: number): void {
    if (errorRate > this.errorThreshold) {
      this.currentRate = Math.max(this.minRate, Math.floor(this.currentRate * this.decreaseFactor));
      return;
    }
    this.currentRate = Math.min(this.maxRate, Math.ceil(this.currentRate * this.increaseFactor));
  }

  getCurrentRate(): number {
    return this.currentRate;
  }
}
