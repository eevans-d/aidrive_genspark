import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  reportError,
  getStoredErrorReports,
  clearStoredErrorReports,
} from '../observability'

const captureExceptionMock = vi.fn()

vi.mock('@sentry/react', () => ({
  captureException: (...args: unknown[]) => captureExceptionMock(...args),
}))

describe('observability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearStoredErrorReports()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('stores error reports locally with anonymized user id', () => {
    reportError({
      error: new Error('Test observability error'),
      source: 'unit-test',
      requestId: 'req-1',
      userId: 'user-123',
      context: { route: '/productos' },
    })

    const reports = getStoredErrorReports()
    expect(reports).toHaveLength(1)
    const report = reports[0]
    expect(report).toBeDefined()
    if (!report) return
    expect(report.message).toBe('Test observability error')
    expect(report.requestId).toBe('req-1')
    expect(report.userHash).toMatch(/^anon_/)
  })

  it('clears stored reports', () => {
    reportError({ error: new Error('to-clear') })
    expect(getStoredErrorReports().length).toBeGreaterThan(0)

    clearStoredErrorReports()
    expect(getStoredErrorReports()).toEqual([])
  })

  it('captures exception in Sentry when DSN is configured', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@example.ingest.sentry.io/1')

    reportError({
      error: new Error('Sentry error'),
      source: 'unit-test',
      context: { feature: 'observability' },
    })

    expect(captureExceptionMock).toHaveBeenCalledTimes(1)
  })
})
