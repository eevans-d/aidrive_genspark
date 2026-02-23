import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('frontend lib/supabase', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('VITE_SUPABASE_URL', 'http://localhost')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.stubEnv('VITE_USE_MOCKS', '0')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('exports a usable supabase client', async () => {
    const mod = await import('../../minimarket-system/src/lib/supabase')

    expect(mod.supabase).toBeDefined()
    expect(typeof (mod.supabase as any).from).toBe('function')
    expect(typeof (mod.supabase as any).auth).toBe('object')
  })

  it('keeps singleton identity across repeated imports', async () => {
    const first = await import('../../minimarket-system/src/lib/supabase')
    const second = await import('../../minimarket-system/src/lib/supabase')

    expect(first.supabase).toBe(second.supabase)
  })
})
