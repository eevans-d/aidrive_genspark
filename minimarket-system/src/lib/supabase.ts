import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { createMockSupabaseClient } from '../mocks/supabaseMock'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const useMocks =
  import.meta.env.VITE_USE_MOCKS === 'true' ||
  import.meta.env.VITE_USE_MOCKS === '1'

if (!useMocks && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Faltan variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Copia .env.example a .env y configura los valores.'
  )
}

export const supabase: SupabaseClient = useMocks
  ? (createMockSupabaseClient() as unknown as SupabaseClient)
  : createClient(supabaseUrl, supabaseAnonKey)
