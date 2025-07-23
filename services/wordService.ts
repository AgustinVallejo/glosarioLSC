import { supabase, Word, Sign, WordWithSigns } from '../supabase'

export class WordsService {
  // Get all words with their signs
  static async getAllWords(): Promise<WordWithSigns[]> {
    const { data, error } = await supabase
      .from('words')
      .select(`
        *,
        signs (*)
      `)
      .order('name')

    if (error) {
      console.error('Error fetching words:', error)
      throw error
    }

    return data as WordWithSigns[]
  }

  // Search words by name
  static async searchWords(searchTerms: string[]): Promise<WordWithSigns[]> {
    if (searchTerms.length === 0) {
      return this.getAllWords()
    }

    // Search for words that match any of the search terms
    const { data, error } = await supabase
      .from('words')
      .select(`
        *,
        signs (*)
      `)
      .in('name', searchTerms.map(term => term.toLowerCase()))
      .order('name')

    if (error) {
      console.error('Error searching words:', error)
      throw error
    }

    return data as WordWithSigns[]
  }

  // Add a new word or add sign to existing word
  static async saveWord(wordName: string, videoFile: File): Promise<void> {
    try {
      // First, check if word exists
      const { data: existingWord } = await supabase
        .from('words')
        .select('id')
        .eq('name', wordName.toLowerCase())
        .single()

      let wordId: string

      if (existingWord) {
        // Word exists, use its ID
        wordId = existingWord.id
      } else {
        // Create new word
        const { data: newWord, error: wordError } = await supabase
          .from('words')
          .insert({ name: wordName.toLowerCase() })
          .select('id')
          .single()

        if (wordError) throw wordError
        wordId = newWord.id
      }

      // Upload video to storage
      const videoFileName = `${wordId}/${Date.now()}.webm`
      const { error: uploadError } = await supabase.storage
        .from('sign-videos')
        .upload(videoFileName, videoFile)

      if (uploadError) throw uploadError

      // Get public URL for the video
      const { data: urlData } = supabase.storage
        .from('sign-videos')
        .getPublicUrl(videoFileName)

      // Save sign record
      const { error: signError } = await supabase
        .from('signs')
        .insert({
          word_id: wordId,
          video_url: urlData.publicUrl
        })

      if (signError) throw signError

    } catch (error) {
      console.error('Error saving word:', error)
      throw error
    }
  }

  // Convert video blob to File (for uploading)
  static createVideoFile(videoBlob: Blob, wordName: string): File {
    return new File([videoBlob], `${wordName}-${Date.now()}.webm`, {
      type: 'video/webm'
    })
  }

  static deleteAllWords(): Promise<void> {
    return new Promise((resolve, reject) => {
      supabase
        .from('words')
        .delete()
        .then(({ error }) => {
          if (error) {
            console.error('Error deleting words:', error)
            reject(error)
          } else {
            resolve()
          }
        })
    })
  }
}