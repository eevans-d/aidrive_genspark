import { act, render, screen } from '@testing-library/react'
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider } from './AuthContext'
import { useAuth } from '../hooks/useAuth'

const {
  getUserMock,
  onAuthStateChangeMock,
  signOutMock,
  refreshSessionMock,
  unsubscribeMock
} = vi.hoisted(() => ({
  getUserMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  signOutMock: vi.fn(),
  refreshSessionMock: vi.fn(),
  unsubscribeMock: vi.fn()
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: getUserMock,
      onAuthStateChange: onAuthStateChangeMock,
      signOut: signOutMock,
      refreshSession: refreshSessionMock,
      signInWithPassword: vi.fn(),
      signUp: vi.fn()
    }
  }
}))

vi.mock('../lib/authEvents', () => ({
  authEvents: {
    on: vi.fn(() => () => undefined)
  }
}))

vi.mock('../lib/observability', () => ({
  reportError: vi.fn()
}))

function AuthProbe() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>loading</div>
  }

  return <div>{user?.email ?? 'anon'}</div>
}

describe('AuthProvider session policy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    window.localStorage.clear()

    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'admin@example.com'
        }
      }
    })
    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: unsubscribeMock
        }
      }
    })
    signOutMock.mockResolvedValue({ error: null })
    refreshSessionMock.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
  })

  it('forces sign out after inactivity timeout', async () => {
    vi.stubEnv('VITE_AUTH_TIMEBOX_MS', '1000')
    vi.stubEnv('VITE_AUTH_INACTIVITY_TIMEOUT_MS', '50')

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('admin@example.com')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(49)
      await Promise.resolve()
    })
    expect(signOutMock).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(2)
      await Promise.resolve()
    })

    expect(signOutMock).toHaveBeenCalledTimes(1)
  })

  it('forces sign out when the session timebox expires', async () => {
    vi.stubEnv('VITE_AUTH_TIMEBOX_MS', '60')
    vi.stubEnv('VITE_AUTH_INACTIVITY_TIMEOUT_MS', '500')

    render(
      <AuthProvider>
        <AuthProbe />
      </AuthProvider>
    )

    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByText('admin@example.com')).toBeInTheDocument()

    await act(async () => {
      vi.advanceTimersByTime(61)
      await Promise.resolve()
    })

    expect(signOutMock).toHaveBeenCalledTimes(1)
  })
})
