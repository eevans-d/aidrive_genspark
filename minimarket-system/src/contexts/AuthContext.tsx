import { useEffect, useState, useCallback, ReactNode, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { AuthChangeEvent, User } from '@supabase/supabase-js'
import { AuthContext } from './auth-context'
import { authEvents } from '../lib/authEvents'
import { reportError } from '../lib/observability'
import {
  AUTH_SESSION_STORAGE_KEYS,
  clearAuthSessionPolicy,
  ensureLastActivityAt,
  ensureSessionStartedAt,
  getAuthSessionPolicyConfig,
  getSessionDeadlineState,
  readStoredTimestamp,
  recordLastActivity
} from '../lib/authSessionPolicy'

const ACTIVITY_THROTTLE_MS = 5_000

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const signOutPromiseRef = useRef<Promise<void> | null>(null)
  const sessionPolicyTimerRef = useRef<number | null>(null)
  const lastActivitySyncRef = useRef(0)

  const clearSessionPolicyTimer = useCallback(() => {
    if (sessionPolicyTimerRef.current !== null) {
      clearTimeout(sessionPolicyTimerRef.current)
      sessionPolicyTimerRef.current = null
    }
  }, [])

  const syncStoredSessionState = useCallback((event: AuthChangeEvent, hasSession: boolean) => {
    if (typeof window === 'undefined') return

    if (!hasSession) {
      clearAuthSessionPolicy(window.localStorage)
      return
    }

    const nowMs = Date.now()
    ensureSessionStartedAt(window.localStorage, nowMs)

    if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
      lastActivitySyncRef.current = recordLastActivity(window.localStorage, nowMs)
      return
    }

    const lastActivityAt = ensureLastActivityAt(window.localStorage, nowMs)
    lastActivitySyncRef.current = lastActivityAt
  }, [])

  const handleSignOut = useCallback(async () => {
    if (signOutPromiseRef.current) {
      return signOutPromiseRef.current
    }

    try {
      signOutPromiseRef.current = supabase.auth.signOut()
        .then(() => undefined)
        .catch((error) => {
          reportError({ error, source: 'AuthContext.signOut' })
          throw error
        })

      await signOutPromiseRef.current
    } catch (error) {
      // Error already reported in the inner catch; keep the promise contract.
    } finally {
      signOutPromiseRef.current = null
    }
  }, [])

  useEffect(() => {
    // Cargar usuario al iniciar
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        reportError({ error, source: 'AuthContext.loadUser' })
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null)
        syncStoredSessionState(event, Boolean(session?.user))
      }
    )

    // Global 401 interceptor: try refresh before forcing signOut
    // Uses a lock to deduplicate concurrent 401 events
    let refreshing: Promise<void> | null = null
    const unsubscribeAuth = authEvents.on(() => {
      if (!refreshing) {
        refreshing = supabase.auth.refreshSession()
          .then(({ error }) => { if (error) handleSignOut() })
          .catch(() => handleSignOut())
          .finally(() => { refreshing = null })
      }
    })

    return () => {
      subscription.unsubscribe()
      unsubscribeAuth()
    }
  }, [handleSignOut, syncStoredSessionState])

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (!user) {
      clearSessionPolicyTimer()
      clearAuthSessionPolicy(window.localStorage)
      lastActivitySyncRef.current = 0
      return
    }

    const policyConfig = getAuthSessionPolicyConfig()
    const storage = window.localStorage

    const scheduleNextSessionCheck = () => {
      const nowMs = Date.now()
      const sessionStartedAt = ensureSessionStartedAt(storage, nowMs)
      const lastActivityAt = ensureLastActivityAt(storage, nowMs)
      const state = getSessionDeadlineState({
        sessionStartedAt,
        lastActivityAt,
        nowMs,
        config: policyConfig
      })

      if (state.expiredReason) {
        clearSessionPolicyTimer()
        void handleSignOut()
        return
      }

      clearSessionPolicyTimer()
      sessionPolicyTimerRef.current = window.setTimeout(() => {
        scheduleNextSessionCheck()
      }, state.nextCheckInMs)
    }

    const syncActivity = (force = false) => {
      const nowMs = Date.now()
      if (!force && nowMs - lastActivitySyncRef.current < ACTIVITY_THROTTLE_MS) {
        return
      }

      lastActivitySyncRef.current = recordLastActivity(storage, nowMs)
      scheduleNextSessionCheck()
    }

    const handleActivity = () => {
      syncActivity()
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea !== storage) return
      if (
        event.key !== null &&
        event.key !== AUTH_SESSION_STORAGE_KEYS.sessionStartedAt &&
        event.key !== AUTH_SESSION_STORAGE_KEYS.lastActivityAt
      ) {
        return
      }

      const externalLastActivity = readStoredTimestamp(
        storage,
        AUTH_SESSION_STORAGE_KEYS.lastActivityAt
      )

      if (externalLastActivity !== null) {
        lastActivitySyncRef.current = externalLastActivity
      }

      scheduleNextSessionCheck()
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        syncActivity(true)
      }
    }

    const handleWindowFocus = () => {
      syncActivity(true)
    }

    scheduleNextSessionCheck()

    const activityEvents: Array<keyof WindowEventMap> = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart'
    ]

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true })
    })
    window.addEventListener('focus', handleWindowFocus)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearSessionPolicyTimer()
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity)
      })
      window.removeEventListener('focus', handleWindowFocus)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [clearSessionPolicyTimer, handleSignOut, user])

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  }

  async function signUp(email: string, password: string, nombre: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nombre: nombre
        }
      }
    })

    if (error) throw error

    // Seguridad: `personal` es fuente de verdad y se endurece vía RLS.
    // El alta/sync de empleados debe hacerse con Admin API + service role (scripts/).

    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
