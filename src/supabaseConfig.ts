const VITE_ENV = (import.meta as any).env ?? {}

export const SUPABASE_URL = VITE_ENV.VITE_SUPABASE_URL || 'https://mmtorfzxnidsczcdygbp.supabase.co'
export const SUPABASE_KEY = VITE_ENV.VITE_SUPABASE_ANON_KEY || 'sb_publishable_fXF7LXgKXeH4p5_Bwai0nQ_d-NWdOk_'
export const SUPABASE_ENV = VITE_ENV.VITE_SUPABASE_ENV || 'production'
