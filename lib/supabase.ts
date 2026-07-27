import { createClient } from '@supabase/supabase-js'

// Lazy singleton — evaluated only when first called, not at module load time.
// Prevents "supabaseKey is required" crash during SSR where NEXT_PUBLIC_ vars
// are not yet injected into the module scope.

let _supabase: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (_supabase) return _supabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  _supabase = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  })

  return _supabase
}

export const supabase = getSupabaseClient()