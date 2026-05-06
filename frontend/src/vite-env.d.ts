/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WAQI_TOKEN: string
  readonly VITE_OWM_API_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_BACKEND_URL: string
  readonly VITE_ML_SERVICE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
