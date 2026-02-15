import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { pedidosQueryKeys, usePedidos, usePedido } from './usePedidos'

// Mock apiClient
vi.mock('../../lib/apiClient', () => ({
  pedidosApi: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    updateEstado: vi.fn(),
    updatePago: vi.fn(),
    updateItemPreparado: vi.fn(),
  },
}))

// Mock supabase (imported transitively by apiClient)
vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } }) },
  },
}))

// Mock authEvents (imported transitively by apiClient)
vi.mock('../../lib/authEvents', () => ({
  authEvents: { emit: vi.fn() },
}))

import { pedidosApi } from '../../lib/apiClient'

const mockedPedidosApi = pedidosApi as {
  list: ReturnType<typeof vi.fn>
  get: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
  updateEstado: ReturnType<typeof vi.fn>
  updatePago: ReturnType<typeof vi.fn>
  updateItemPreparado: ReturnType<typeof vi.fn>
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children)
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// 1. pedidosQueryKeys
// ---------------------------------------------------------------------------
describe('pedidosQueryKeys', () => {
  it('all returns ["pedidos"]', () => {
    expect(pedidosQueryKeys.all).toEqual(['pedidos'])
  })

  it('lists() returns ["pedidos", "list"]', () => {
    expect(pedidosQueryKeys.lists()).toEqual(['pedidos', 'list'])
  })

  it('list({}) returns ["pedidos", "list", {}]', () => {
    expect(pedidosQueryKeys.list({})).toEqual(['pedidos', 'list', {}])
  })

  it('list({ estado: "pendiente" }) includes the filter', () => {
    expect(pedidosQueryKeys.list({ estado: 'pendiente' })).toEqual([
      'pedidos',
      'list',
      { estado: 'pendiente' },
    ])
  })

  it('details() returns ["pedidos", "detail"]', () => {
    expect(pedidosQueryKeys.details()).toEqual(['pedidos', 'detail'])
  })

  it('detail("abc") returns ["pedidos", "detail", "abc"]', () => {
    expect(pedidosQueryKeys.detail('abc')).toEqual(['pedidos', 'detail', 'abc'])
  })
})

// ---------------------------------------------------------------------------
// 2. usePedidos - queryFn transformation and filter forwarding
// ---------------------------------------------------------------------------
describe('usePedidos', () => {
  it('computes pendientes, preparando, and listos counts from returned pedidos', async () => {
    mockedPedidosApi.list.mockResolvedValueOnce({
      pedidos: [
        { id: '1', estado: 'pendiente' },
        { id: '2', estado: 'pendiente' },
        { id: '3', estado: 'preparando' },
        { id: '4', estado: 'listo' },
        { id: '5', estado: 'entregado' },
      ],
      total: 5,
    })

    const { result } = renderHook(() => usePedidos(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      pedidos: [
        { id: '1', estado: 'pendiente' },
        { id: '2', estado: 'pendiente' },
        { id: '3', estado: 'preparando' },
        { id: '4', estado: 'listo' },
        { id: '5', estado: 'entregado' },
      ],
      total: 5,
      pendientes: 2,
      preparando: 1,
      listos: 1,
    })
  })

  it('falls back to pedidos.length when result.total is missing', async () => {
    mockedPedidosApi.list.mockResolvedValueOnce({
      pedidos: [
        { id: '1', estado: 'pendiente' },
        { id: '2', estado: 'listo' },
      ],
    })

    const { result } = renderHook(() => usePedidos(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.total).toBe(2)
  })

  it('does NOT pass estado to api params when estado is "todos"', async () => {
    mockedPedidosApi.list.mockResolvedValueOnce({ pedidos: [], total: 0 })

    const { result } = renderHook(() => usePedidos({ estado: 'todos' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedPedidosApi.list).toHaveBeenCalledWith({})
  })

  it('does NOT pass estado_pago to api params when estado_pago is "todos"', async () => {
    mockedPedidosApi.list.mockResolvedValueOnce({ pedidos: [], total: 0 })

    const { result } = renderHook(() => usePedidos({ estado_pago: 'todos' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedPedidosApi.list).toHaveBeenCalledWith({})
  })

  it('passes specific estado filter to pedidosApi.list', async () => {
    mockedPedidosApi.list.mockResolvedValueOnce({ pedidos: [], total: 0 })

    const { result } = renderHook(() => usePedidos({ estado: 'pendiente' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedPedidosApi.list).toHaveBeenCalledWith({ estado: 'pendiente' })
  })

  it('passes fecha_desde, fecha_hasta, limit, and offset when provided', async () => {
    mockedPedidosApi.list.mockResolvedValueOnce({ pedidos: [], total: 0 })

    const { result } = renderHook(
      () =>
        usePedidos({
          fecha_desde: '2026-01-01',
          fecha_hasta: '2026-01-31',
          limit: 10,
          offset: 20,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedPedidosApi.list).toHaveBeenCalledWith({
      fecha_desde: '2026-01-01',
      fecha_hasta: '2026-01-31',
      limit: '10',
      offset: '20',
    })
  })

  it('returns empty counts when pedidos array is empty', async () => {
    mockedPedidosApi.list.mockResolvedValueOnce({ pedidos: [], total: 0 })

    const { result } = renderHook(() => usePedidos(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({
      pedidos: [],
      total: 0,
      pendientes: 0,
      preparando: 0,
      listos: 0,
    })
  })

  it('defaults to empty array when result.pedidos is undefined', async () => {
    mockedPedidosApi.list.mockResolvedValueOnce({})

    const { result } = renderHook(() => usePedidos(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data!.pedidos).toEqual([])
    expect(result.current.data!.total).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 3. usePedido - disabled when id is null
// ---------------------------------------------------------------------------
describe('usePedido', () => {
  it('is disabled when id is null', () => {
    const { result } = renderHook(() => usePedido(null), { wrapper: createWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(mockedPedidosApi.get).not.toHaveBeenCalled()
  })

  it('fetches when id is provided', async () => {
    const pedido = { id: 'abc', estado: 'pendiente' }
    mockedPedidosApi.get.mockResolvedValueOnce(pedido)

    const { result } = renderHook(() => usePedido('abc'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(mockedPedidosApi.get).toHaveBeenCalledWith('abc')
    expect(result.current.data).toEqual(pedido)
  })
})
