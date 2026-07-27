import { createBrowserClient } from '@supabase/ssr'

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; role: string | null }
      }
    }
  }
}

export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)