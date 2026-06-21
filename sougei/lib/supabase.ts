import { createClient } from '@supabase/supabase-js'

// 公開可能な anon キー（RLSで保護）。Vercel等の環境変数があれば優先。
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wtobisqxcnomjglpivec.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0b2Jpc3F4Y25vbWpnbHBpdmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTUzNzUsImV4cCI6MjA5NzE5MTM3NX0.PcgrsR0Fwv4pCVDv8bWpTQe_jlOwHNmkyH5tgimDB54'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } },
})
