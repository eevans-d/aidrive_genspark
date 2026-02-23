import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useIsMobile } from '../use-mobile'

let onChangeHandler: ((event: Event) => void) | null = null

describe('useIsMobile', () => {
  beforeEach(() => {
    onChangeHandler = null

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: window.innerWidth < 768,
        media: query,
        onchange: null,
        addEventListener: (_type: string, callback: (event: Event) => void) => {
          onChangeHandler = callback
        },
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('returns true for mobile width', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 500 })
    const { result } = renderHook(() => useIsMobile())

    await waitFor(() => expect(result.current).toBe(true))
  })

  it('returns false for desktop width', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1024 })
    const { result } = renderHook(() => useIsMobile())

    await waitFor(() => expect(result.current).toBe(false))
  })

  it('updates when media query change listener fires', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 1024 })
    const { result } = renderHook(() => useIsMobile())

    await waitFor(() => expect(result.current).toBe(false))

    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, writable: true, value: 500 })
      onChangeHandler?.(new Event('change'))
    })

    await waitFor(() => expect(result.current).toBe(true))
  })
})
