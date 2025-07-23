export interface SignVideo {
  id: string
  video_url: string  // Changed from dataUrl to video_url
  timestamp: number  // We'll convert created_at to timestamp for compatibility
}

export interface Word {
  id: string
  name: string
  signs: SignVideo[]
}

// Utility function to convert Supabase data to your existing format
export function convertSupabaseToAppFormat(supabaseWords: any[]): Word[] {
  return supabaseWords.map(word => ({
    id: word.id,
    name: word.name,
    signs: word.signs.map((sign: any) => ({
      id: sign.id,
      video_url: sign.video_url,
      timestamp: new Date(sign.created_at).getTime()
    })).sort((a: SignVideo, b: SignVideo) => b.timestamp - a.timestamp)
  }))
}