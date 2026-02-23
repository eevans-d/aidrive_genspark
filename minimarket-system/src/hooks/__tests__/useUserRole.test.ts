import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useUserRole } from '../useUserRole'

const useVerifiedRoleMock = vi.fn()

vi.mock('../useVerifiedRole', () => ({
  useVerifiedRole: () => useVerifiedRoleMock(),
}))

describe('useUserRole', () => {
  it('returns admin capabilities and allowed routes', () => {
    useVerifiedRoleMock.mockReturnValue({
      role: 'admin',
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useUserRole())

    expect(result.current.role).toBe('admin')
    expect(result.current.isAdmin).toBe(true)
    expect(result.current.isDeposito).toBe(true)
    expect(result.current.isVentas).toBe(true)
    expect(result.current.canAccess('/deposito')).toBe(true)
    expect(result.current.allowedRoutes).toContain('/deposito')
  })

  it('denies restricted routes for usuario role', () => {
    useVerifiedRoleMock.mockReturnValue({
      role: 'usuario',
      loading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { result } = renderHook(() => useUserRole())

    expect(result.current.isAdmin).toBe(false)
    expect(result.current.canAccess('/deposito')).toBe(false)
    expect(result.current.canAccess('/stock')).toBe(true)
  })
})
