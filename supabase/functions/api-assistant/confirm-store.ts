/**
 * In-memory confirm token store for Sprint 2 action confirmation.
 *
 * Tokens are single-use, expire after TTL_MS, and are scoped per user.
 * Pure module — no Deno runtime dependencies (crypto.randomUUID is standard).
 *
 * Design:
 *  - Each token stores the full action plan (intent + payload).
 *  - consume() returns the plan and deletes the token atomically.
 *  - GC runs on every store() to avoid unbounded growth.
 */

export interface ActionPlan {
  intent: string;
  label: string;
  payload: Record<string, unknown>;
  summary: string;
  risk: 'bajo' | 'medio' | 'alto';
}

interface StoredToken {
  token: string;
  userId: string;
  plan: ActionPlan;
  createdAt: number;
}

const TTL_MS = 120_000; // 2 minutes
const MAX_TOKENS = 200;

const store = new Map<string, StoredToken>();

function gc(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.createdAt > TTL_MS) {
      store.delete(key);
    }
  }
  // Hard cap
  if (store.size > MAX_TOKENS) {
    const sorted = [...store.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt);
    const toRemove = sorted.slice(0, store.size - MAX_TOKENS);
    for (const [key] of toRemove) store.delete(key);
  }
}

export function createConfirmToken(userId: string, plan: ActionPlan): string {
  gc();
  const token = crypto.randomUUID();
  store.set(token, { token, userId, plan, createdAt: Date.now() });
  return token;
}

export interface ConsumeResult {
  ok: true;
  plan: ActionPlan;
}

export interface ConsumeError {
  ok: false;
  reason: 'NOT_FOUND' | 'EXPIRED' | 'USER_MISMATCH';
}

export function consumeConfirmToken(
  token: string,
  userId: string,
): ConsumeResult | ConsumeError {
  const entry = store.get(token);
  if (!entry) {
    return { ok: false, reason: 'NOT_FOUND' };
  }

  // Always delete on consume attempt (single-use)
  store.delete(token);

  if (Date.now() - entry.createdAt > TTL_MS) {
    return { ok: false, reason: 'EXPIRED' };
  }

  if (entry.userId !== userId) {
    return { ok: false, reason: 'USER_MISMATCH' };
  }

  return { ok: true, plan: entry.plan };
}

/** Visible for testing */
export function _storeSize(): number {
  return store.size;
}

export function _clearAll(): void {
  store.clear();
}
