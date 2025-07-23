
import { createClient } from '@supabase/supabase-js'

// Get these from your Supabase project settings
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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