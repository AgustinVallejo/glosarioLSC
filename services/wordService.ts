import { supabase, Word, Sign, WordWithSigns } from '../supabase'

export class WordsService {
  // Debug function to test Supabase connection
  static async testConnection(): Promise<void> {
    console.log('🧪 [WordsService] Testing Supabase connection...')
    try {
      const { data, error } = await supabase.from('words').select('count').limit(1)
      console.log('🧪 [WordsService] Connection test result:', { data, error })
      if (error) {
        console.error('❌ [WordsService] Connection test failed:', error)
      } else {
        console.log('✅ [WordsService] Connection test successful')
      }
    } catch (err) {
      console.error('💥 [WordsService] Connection test threw error:', err)
    }
  }

  // Get all words with their signs
  static async getAllWords(): Promise<WordWithSigns[]> {
    console.log('🔍 [WordsService] Starting getAllWords...')
    
    try {
      const { data, error } = await supabase
        .from('words')
        .select(`
          *,
          signs (*)
        `)
        .order('name')

      console.log('📊 [WordsService] Supabase response:', { data, error })

      if (error) {
        console.error('❌ [WordsService] Error fetching words:', error)
        console.error('❌ [WordsService] Error details:', {
          message: error.message,
          code: error.code,
          hint: error.hint,
          details: error.details
        })
        throw error
      }

      console.log('✅ [WordsService] Successfully fetched', data?.length || 0, 'words')
      return data as WordWithSigns[]
    } catch (err) {
      console.error('💥 [WordsService] Unexpected error in getAllWords:', err)
      throw err
    }
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
  static async saveWord(wordName: string, videoBlob: Blob, existingWords: WordWithSigns[] = []): Promise<void> {
    console.log('💾 [WordsService] Starting saveWord...', { 
      wordName, 
      blobSize: videoBlob.size, 
      blobType: videoBlob.type,
      existingWordsCount: existingWords.length
    })

    try {
      // Convert Blob to File for upload
      const videoFile = new File([videoBlob], `${wordName}-${Date.now()}.webm`, { 
        type: videoBlob.type || 'video/webm' 
      });
      console.log('📁 [WordsService] Created video file:', {
        name: videoFile.name,
        size: videoFile.size,
        type: videoFile.type
      })

      // Check if word exists in the provided list (no database call needed!)
      console.log('🔍 [WordsService] Checking if word exists in local data:', wordName.toLowerCase())
      const existingWord = existingWords.find(word => word.name.toLowerCase() === wordName.toLowerCase())
      console.log('📊 [WordsService] Word search result from local data:', existingWord ? { id: existingWord.id, name: existingWord.name } : 'not found')

      let wordId: string

      if (existingWord) {
        // Word exists, use its ID
        wordId = existingWord.id
        console.log('✅ [WordsService] Using existing word ID:', wordId)
      } else {
        // Create new word
        console.log('➕ [WordsService] Creating new word:', wordName.toLowerCase())
        const { data: newWord, error: wordError } = await supabase
          .from('words')
          .insert({ name: wordName.toLowerCase() })
          .select('id')
          .single()

        console.log('📊 [WordsService] New word creation result:', { newWord, wordError })

        if (wordError) {
          console.error('❌ [WordsService] Error creating word:', {
            message: wordError.message,
            code: wordError.code,
            hint: wordError.hint,
            details: wordError.details
          })
          throw wordError
        }
        wordId = newWord.id
        console.log('✅ [WordsService] Created new word with ID:', wordId)
      }

      // Upload video to storage
      const videoFileName = `${wordId}/${Date.now()}.webm`
      console.log('📤 [WordsService] Uploading video to storage:', videoFileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('sign-videos')
        .upload(videoFileName, videoFile)

      console.log('📊 [WordsService] Upload result:', { uploadData, uploadError })

      if (uploadError) {
        console.error('❌ [WordsService] Error uploading video:', uploadError)
        throw uploadError
      }

      // Get public URL for the video
      console.log('🔗 [WordsService] Getting public URL for video...')
      const { data: urlData } = supabase.storage
        .from('sign-videos')
        .getPublicUrl(videoFileName)

      console.log('📊 [WordsService] Public URL data:', urlData)

      // Save sign record
      console.log('💾 [WordsService] Saving sign record...', {
        word_id: wordId,
        video_url: urlData.publicUrl
      })
      
      const { data: signData, error: signError } = await supabase
        .from('signs')
        .insert({
          word_id: wordId,
          video_url: urlData.publicUrl
        })

      console.log('📊 [WordsService] Sign creation result:', { signData, signError })

      if (signError) {
        console.error('❌ [WordsService] Error creating sign:', {
          message: signError.message,
          code: signError.code,
          hint: signError.hint,
          details: signError.details
        })
        throw signError
      }

      console.log('🎉 [WordsService] Successfully saved word and sign!')

    } catch (error) {
      console.error('💥 [WordsService] Unexpected error in saveWord:', error)
      console.error('💥 [WordsService] Error stack:', error instanceof Error ? error.stack : 'No stack trace')
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