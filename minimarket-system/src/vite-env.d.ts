/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_TIMEBOX_MS?: string
  readonly VITE_AUTH_INACTIVITY_TIMEOUT_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
