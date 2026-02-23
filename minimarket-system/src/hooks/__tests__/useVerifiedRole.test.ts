import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useVerifiedRole } from '../useVerifiedRole'

const useAuthMock = vi.fn()
const fromMock = vi.fn()
const singleMock = vi.fn()

vi.mock('../useAuth', () => ({
  useAuth: () => useAuthMock(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
  },
}))

function createBuilder() {
  const builder: any = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: (...args: unknown[]) => singleMock(...args),
  }
  return builder
}

describe('useVerifiedRole', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fromMock.mockImplementation(() => createBuilder())
  })

  it('falls back to usuario when there is no authenticated user', async () => {
    useAuthMock.mockReturnValue({ user: null, loading: false })

    const { result } = renderHook(() => useVerifiedRole())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.role).toBe('usuario')
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('maps role from personal table and normalizes variants', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1' }, loading: false })
    singleMock.mockResolvedValue({ data: { rol: 'Administrador' }, error: null })

    const { result } = renderHook(() => useVerifiedRole())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.role).toBe('admin')
    expect(fromMock).toHaveBeenCalledWith('personal')
  })

  it('returns usuario and exposes error on unexpected thrown failures', async () => {
    useAuthMock.mockReturnValue({ user: { id: 'user-1' }, loading: false })
    singleMock.mockRejectedValue(new Error('Database unavailable'))

    const { result } = renderHook(() => useVerifiedRole())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.role).toBe('usuario')
    expect(result.current.error).toContain('Database unavailable')
  })
})
