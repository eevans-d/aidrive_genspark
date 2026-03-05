import { createContext } from 'react'
import type { User, Session } from '@supabase/supabase-js'

export interface AuthData {
  user: User | null
  session: Session | null
}

export interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthData>
  signUp: (email: string, password: string, nombre: string) => Promise<AuthData>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)
