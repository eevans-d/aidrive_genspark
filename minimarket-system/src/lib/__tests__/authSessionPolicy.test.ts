import { describe, expect, it } from 'vitest'
import {
  AUTH_SESSION_STORAGE_KEYS,
  clearAuthSessionPolicy,
  ensureLastActivityAt,
  ensureSessionStartedAt,
  getAuthSessionPolicyConfig,
  getSessionDeadlineState,
  parseDurationMs,
  readStoredTimestamp,
  recordLastActivity
} from '../authSessionPolicy'

describe('authSessionPolicy', () => {
  it('uses fallback duration when env value is invalid', () => {
    expect(parseDurationMs(undefined, 1000)).toBe(1000)
    expect(parseDurationMs('0', 1000)).toBe(1000)
    expect(parseDurationMs('-10', 1000)).toBe(1000)
    expect(parseDurationMs('abc', 1000)).toBe(1000)
  })

  it('builds config from env overrides', () => {
    expect(getAuthSessionPolicyConfig({
      VITE_AUTH_TIMEBOX_MS: '9000',
      VITE_AUTH_INACTIVITY_TIMEOUT_MS: '3000'
    })).toEqual({
      timeboxMs: 9000,
      inactivityTimeoutMs: 3000
    })
  })

  it('persists and clears session timestamps safely', () => {
    const storage = window.localStorage
    storage.clear()

    expect(ensureSessionStartedAt(storage, 100)).toBe(100)
    expect(ensureSessionStartedAt(storage, 200)).toBe(100)

    expect(ensureLastActivityAt(storage, 150)).toBe(150)
    expect(recordLastActivity(storage, 250)).toBe(250)
    expect(readStoredTimestamp(storage, AUTH_SESSION_STORAGE_KEYS.lastActivityAt)).toBe(250)

    clearAuthSessionPolicy(storage)

    expect(storage.getItem(AUTH_SESSION_STORAGE_KEYS.sessionStartedAt)).toBeNull()
    expect(storage.getItem(AUTH_SESSION_STORAGE_KEYS.lastActivityAt)).toBeNull()
  })

  it('expires by inactivity before timebox when activity is stale', () => {
    const state = getSessionDeadlineState({
      sessionStartedAt: 0,
      lastActivityAt: 0,
      nowMs: 8_001,
      config: {
        timeboxMs: 24_000,
        inactivityTimeoutMs: 8_000
      }
    })

    expect(state.expiredReason).toBe('inactivity')
    expect(state.nextCheckInMs).toBe(0)
  })

  it('expires by timebox even if there was recent activity', () => {
    const state = getSessionDeadlineState({
      sessionStartedAt: 0,
      lastActivityAt: 20_000,
      nowMs: 24_001,
      config: {
        timeboxMs: 24_000,
        inactivityTimeoutMs: 8_000
      }
    })

    expect(state.expiredReason).toBe('timebox')
    expect(state.nextCheckInMs).toBe(0)
  })

  it('returns next check delay for the earliest pending deadline', () => {
    const state = getSessionDeadlineState({
      sessionStartedAt: 1_000,
      lastActivityAt: 6_000,
      nowMs: 7_500,
      config: {
        timeboxMs: 24_000,
        inactivityTimeoutMs: 8_000
      }
    })

    expect(state.expiredReason).toBeNull()
    expect(state.nextCheckInMs).toBe(6_500)
    expect(state.inactivityExpiresAt).toBe(14_000)
    expect(state.timeboxExpiresAt).toBe(25_000)
  })
})
