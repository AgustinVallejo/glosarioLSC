
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vghbgzfmuenysniygwzs.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZnaGJnemZtdWVueXNuaXlnd3pzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzMDU3MjUsImV4cCI6MjA2ODg4MTcyNX0.33RQjWWHqGxiwtN4LxiWG_D2lZqLnoCLvxcePV3tWdg'

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
  note?: string  // Optional note about this specific sign
  latitude?: number  // Optional GPS latitude for this sign
  longitude?: number  // Optional GPS longitude for this sign
  city?: string  // Optional nearby city name for this sign
  test: boolean  // Whether this sign was created in test/development mode
  created_at: string
}

// Combined type for easier querying
export interface WordWithSigns extends Word {
  signs: Sign[]
}