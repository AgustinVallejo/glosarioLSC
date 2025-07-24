
import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

// Debug: Log environment variables (without exposing the full keys)
console.log('🔧 [Supabase] Environment check:', {
  hasUrl: !!supabaseUrl,
  urlPrefix: supabaseUrl?.substring(0, 20) + '...',
  hasKey: !!supabaseAnonKey,
  keyPrefix: supabaseAnonKey?.substring(0, 20) + '...'
})

if (!supabaseUrl) {
  console.error('❌ [Supabase] SUPABASE_URL is not defined!')
}
if (!supabaseAnonKey) {
  console.error('❌ [Supabase] SUPABASE_ANON_KEY is not defined!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('✅ [Supabase] Client created successfully')

// Database types (based on our schema)
export interface Word {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface Sign {
  id: string
  word_id: string
  video_url: string
  created_at: string
}

// Combined type for easier querying
export interface WordWithSigns extends Word {
  signs: Sign[]
}