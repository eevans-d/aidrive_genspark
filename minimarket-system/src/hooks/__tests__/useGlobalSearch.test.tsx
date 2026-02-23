import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useGlobalSearch } from '../useGlobalSearch'

const globalSearchMock = vi.fn()

vi.mock('../../lib/apiClient', () => ({
  searchApi: {
    global: (...args: unknown[]) => globalSearchMock(...args),
  },
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useGlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches results when query has at least 2 characters', async () => {
    globalSearchMock.mockResolvedValue({
      productos: [{ id: 'p1', nombre: 'Coca Cola' }],
      pedidos: [],
      clientes: [],
      proveedores: [],
      tareas: [],
    })

    const { result } = renderHook(() => useGlobalSearch('co', true), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(globalSearchMock).toHaveBeenCalledWith('co')
    expect(result.current.data?.productos).toHaveLength(1)
  })

  it('keeps query disabled when query length is less than 2', () => {
    const { result } = renderHook(() => useGlobalSearch('c', true), {
      wrapper: createWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(globalSearchMock).not.toHaveBeenCalled()
  })
})
