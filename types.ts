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
  console.log('🔄 [Types] Converting Supabase data to app format...', supabaseWords.length, 'words')
  
  const convertedWords = supabaseWords.map((word, wordIndex) => {
    console.log(`🔄 [Types] Converting word ${wordIndex + 1}: "${word.name}"`)
    console.log(`  📊 Raw word data:`, word)
    
    const convertedSigns = word.signs.map((sign: any, signIndex: number) => {
      console.log(`  🎥 Converting sign ${signIndex + 1}:`, sign)
      const convertedSign = {
        id: sign.id,
        video_url: sign.video_url,
        timestamp: new Date(sign.created_at).getTime()
      }
      console.log(`  ✅ Converted sign:`, convertedSign)
      return convertedSign
    }).sort((a: SignVideo, b: SignVideo) => b.timestamp - a.timestamp)
    
    const convertedWord = {
      id: word.id,
      name: word.name,
      signs: convertedSigns
    }
    
    console.log(`✅ [Types] Converted word "${word.name}":`, convertedWord)
    return convertedWord
  })
  
  console.log('🎉 [Types] Conversion completed:', convertedWords.length, 'words converted')
  return convertedWords
}