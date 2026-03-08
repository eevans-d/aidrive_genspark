export const DEFAULT_AUTH_TIMEBOX_MS = 24 * 60 * 60 * 1000
export const DEFAULT_AUTH_INACTIVITY_TIMEOUT_MS = 8 * 60 * 60 * 1000
const MAX_TIMER_DELAY_MS = 2_147_483_647

export const AUTH_SESSION_STORAGE_KEYS = {
  sessionStartedAt: 'aidrive.auth.session_started_at',
  lastActivityAt: 'aidrive.auth.last_activity_at'
} as const

export type AuthSessionTimeoutReason = 'timebox' | 'inactivity'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type AuthSessionPolicyConfig = {
  timeboxMs: number
  inactivityTimeoutMs: number
}

export function parseDurationMs(
  rawValue: string | boolean | undefined,
  fallbackMs: number
) {
  if (typeof rawValue !== 'string') return fallbackMs

  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackMs
  }

  return Math.floor(parsed)
}

export function getAuthSessionPolicyConfig(
  env: Record<string, string | boolean | undefined> = import.meta.env
): AuthSessionPolicyConfig {
  return {
    timeboxMs: parseDurationMs(env.VITE_AUTH_TIMEBOX_MS, DEFAULT_AUTH_TIMEBOX_MS),
    inactivityTimeoutMs: parseDurationMs(
      env.VITE_AUTH_INACTIVITY_TIMEOUT_MS,
      DEFAULT_AUTH_INACTIVITY_TIMEOUT_MS
    )
  }
}

export function readStoredTimestamp(
  storage: StorageLike,
  key: string
): number | null {
  const rawValue = storage.getItem(key)
  if (!rawValue) return null

  const parsed = Number(rawValue)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    storage.removeItem(key)
    return null
  }

  return parsed
}

export function writeStoredTimestamp(
  storage: StorageLike,
  key: string,
  timestampMs: number
) {
  storage.setItem(key, String(timestampMs))
  return timestampMs
}

export function ensureSessionStartedAt(
  storage: StorageLike,
  nowMs: number
) {
  const existing = readStoredTimestamp(storage, AUTH_SESSION_STORAGE_KEYS.sessionStartedAt)
  if (existing !== null) {
    return existing
  }

  return writeStoredTimestamp(storage, AUTH_SESSION_STORAGE_KEYS.sessionStartedAt, nowMs)
}

export function ensureLastActivityAt(
  storage: StorageLike,
  nowMs: number
) {
  const existing = readStoredTimestamp(storage, AUTH_SESSION_STORAGE_KEYS.lastActivityAt)
  if (existing !== null) {
    return existing
  }

  return writeStoredTimestamp(storage, AUTH_SESSION_STORAGE_KEYS.lastActivityAt, nowMs)
}

export function recordLastActivity(
  storage: StorageLike,
  nowMs: number
) {
  return writeStoredTimestamp(storage, AUTH_SESSION_STORAGE_KEYS.lastActivityAt, nowMs)
}

export function clearAuthSessionPolicy(storage: StorageLike) {
  storage.removeItem(AUTH_SESSION_STORAGE_KEYS.sessionStartedAt)
  storage.removeItem(AUTH_SESSION_STORAGE_KEYS.lastActivityAt)
}

export function getSessionDeadlineState(args: {
  sessionStartedAt: number
  lastActivityAt: number
  nowMs: number
  config: AuthSessionPolicyConfig
}) {
  const { sessionStartedAt, lastActivityAt, nowMs, config } = args
  const timeboxExpiresAt = sessionStartedAt + config.timeboxMs
  const inactivityExpiresAt = lastActivityAt + config.inactivityTimeoutMs
  const earliestExpiresAt = Math.min(timeboxExpiresAt, inactivityExpiresAt)

  if (nowMs >= earliestExpiresAt) {
    const expiredReason: AuthSessionTimeoutReason =
      timeboxExpiresAt <= inactivityExpiresAt ? 'timebox' : 'inactivity'

    return {
      expiredReason,
      nextCheckInMs: 0,
      timeboxExpiresAt,
      inactivityExpiresAt
    }
  }

  return {
    expiredReason: null,
    nextCheckInMs: Math.min(
      Math.max(earliestExpiresAt - nowMs, 1),
      MAX_TIMER_DELAY_MS
    ),
    timeboxExpiresAt,
    inactivityExpiresAt
  }
}
