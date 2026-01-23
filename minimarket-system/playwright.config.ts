import { defineConfig } from '@playwright/test'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Cargar variables de entorno desde .env.test en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../.env.test') })

// Determinar si usar mocks o Supabase real
const USE_MOCKS = process.env.VITE_USE_MOCKS === 'true' || !process.env.SUPABASE_URL

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'pnpm dev -- --host',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    env: USE_MOCKS
      ? { VITE_USE_MOCKS: 'true' }
      : {
          VITE_SUPABASE_URL: process.env.SUPABASE_URL || '',
          VITE_SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || ''
        }
  }
})
