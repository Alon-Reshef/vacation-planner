import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Project URL only — e.g. https://abcd1234.supabase.co (no /rest/v1) */
export function normalizeSupabaseUrl(raw: string): string {
  let url = raw.trim()
  url = url.replace(/\/rest\/v1\/?$/i, '')
  url = url.replace(/\/+$/, '')
  return url
}

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
const url = rawUrl ? normalizeSupabaseUrl(rawUrl) : undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!)
  : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to GitHub Actions secrets (or local .env).',
    )
  }
  return supabase
}

export function supabaseUrlHint(): string | null {
  if (!rawUrl) return null
  if (/\/rest\/v1/i.test(rawUrl.trim())) {
    return 'VITE_SUPABASE_URL must be https://YOUR_PROJECT.supabase.co only — remove /rest/v1 from the URL.'
  }
  return null
}
