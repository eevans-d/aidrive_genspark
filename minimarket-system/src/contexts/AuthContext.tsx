import { useEffect, useState, useCallback, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { User } from '@supabase/supabase-js'
import { AuthContext } from './auth-context'
import { authEvents } from '../lib/authEvents'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const handleSignOut = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }, [])

  useEffect(() => {
    // Cargar usuario al iniciar
    async function loadUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUser()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user || null)
      }
    )

    // Global 401 interceptor: signOut on AUTH_REQUIRED from apiClient
    const unsubscribeAuth = authEvents.on(() => {
      handleSignOut()
    })

    return () => {
      subscription.unsubscribe()
      unsubscribeAuth()
    }
  }, [handleSignOut])

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
