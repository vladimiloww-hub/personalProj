import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null | undefined

/** Server-side Supabase client with the secret key, or null when it isn't configured. */
export function supabaseAdmin(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
  return client
}
