import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn(
    '[SiDIAG Madrasah] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. ' +
      'Salin .env.example ke .env dan isi kredensial Supabase Anda sebelum login/registrasi berfungsi.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
)

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'SiDIAG Madrasah'
export const ACADEMIC_YEAR = import.meta.env.VITE_ACADEMIC_YEAR || ''
export const ORGANIZER_NAME = import.meta.env.VITE_ORGANIZER_NAME || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
