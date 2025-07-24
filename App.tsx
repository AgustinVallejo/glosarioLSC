import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Word, convertSupabaseToAppFormat } from './types';
import { WordsService } from './services/wordService.ts';
import { WordCard } from './components/WordCard';
import { NonWordCard } from './components/NonWordCard';
import { AddWordModal } from './components/AddWordModal';
import { PlusIcon, VideoCameraIcon } from './components/icons';

const App: React.FC = () => {
  const [wordsList, setWordsList] = useState<Word[]>([]);
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [editingWordName, setEditingWordName] = useState<string | null>(null);
  const [newWordName, setNewWordName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load words from Supabase on mount
  useEffect(() => {
    console.log('🚀 [App] Component mounted, testing connection and loading words...')
    // Test connection first
    WordsService.testConnection()
    loadWords();
  }, []);

  const loadWords = async () => {
    console.log('🔄 [App] Starting loadWords...')
    try {
      setIsLoading(true);
      setError(null);
      console.log('📞 [App] Calling WordsService.getAllWords()')
      const supabaseWords = await WordsService.getAllWords();
      console.log('📊 [App] Received supabase words:', supabaseWords)
      const appFormatWords = convertSupabaseToAppFormat(supabaseWords);
      console.log('📊 [App] Converted to app format:', appFormatWords)
      console.log('📊 [App] Sample word structure:', appFormatWords[0])
      setWordsList(appFormatWords);
      console.log('✅ [App] Successfully loaded', appFormatWords.length, 'words')
    } catch (error) {
      console.error('❌ [App] Error loading words:', error);
      setError('Error al cargar las palabras. Por favor, recarga la página.');
    } finally {
      setIsLoading(false);
      console.log('🏁 [App] Finished loadWords')
    }
  };

  const handleSaveWord = useCallback(async (wordNameInput: string, videoBlob: Blob) => {
    console.log('💾 [App] Starting handleSaveWord...', { 
      wordNameInput, 
      blobSize: videoBlob.size, 
      blobType: videoBlob.type,
      currentWordsCount: wordsList.length
    })
    
    try {
      setError(null);
      
      // Debug: Check if we're getting the blob correctly
      console.log('🎯 [App] Received blob details:', {
        size: videoBlob.size,
        type: videoBlob.type,
        constructor: videoBlob.constructor.name
      })
      
      // Convert current words list to format service expects
      const existingWordsForService = wordsList.map(word => ({
        id: word.id,
        name: word.name,
        created_at: '', // Not needed for lookup
        updated_at: '', // Not needed for lookup
        signs: word.signs.map(sign => ({
          id: sign.id,
          word_id: word.id,
          video_url: sign.video_url,
          created_at: new Date(sign.timestamp).toISOString()
        }))
      }))
      
      console.log('🔍 [App] Converted words for service:', existingWordsForService.length, 'words')
      
      // Save to Supabase (pass existing words to avoid database lookup)
      console.log('📞 [App] Calling WordsService.saveWord with blob and existing words')
      await WordsService.saveWord(wordNameInput, videoBlob, existingWordsForService);
      console.log('✅ [App] Successfully saved word')
      
      // Reload words to show the new addition
      console.log('🔄 [App] Reloading words after save...')
      await loadWords();
      
      setShowAddWordModal(false);
      setEditingWordName(null);
      console.log('🎉 [App] handleSaveWord completed successfully!')
    } catch (error) {
      console.error('❌ [App] Error in handleSaveWord:', error);
      console.error('❌ [App] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setError('Error al guardar la palabra. Inténtalo de nuevo.');
    }
  }, [wordsList]);

  const handleOpenAddWordModal = (wordName?: string) => {
    if (wordName) {
      // Check if this word already exists
      const existingWord = wordsList.find(w => w.name.toLowerCase() === wordName.toLowerCase());
      if (existingWord) {
        // Adding alternative sign for existing word
        setEditingWordName(wordName);
        setNewWordName(null);
      } else {
        // Adding new word with pre-filled name
        setEditingWordName(null);
        setNewWordName(wordName);
      }
    } else {
      // Adding completely new word
      setEditingWordName(null);
      setNewWordName(null);
    }
    setShowAddWordModal(true);
  };
  
  const displayedWords = useMemo(() => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      return wordsList;
    }

    const searchWordsArray = trimmedSearchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 0);
    
    const foundWordsInOrder: Word[] = [];
    const wordsMap = new Map<string, Word>();
    wordsList.forEach(word => {
      wordsMap.set(word.name.toLowerCase(), word);
    });

    for (const searchWord of searchWordsArray) {
      const matchedWord = wordsMap.get(searchWord);
      if (matchedWord) {
        foundWordsInOrder.push(matchedWord);
      }
    }
    return foundWordsInOrder;
  }, [searchTerm, wordsList]);

  // New phrase data for displaying complete phrases with both found and missing words
  const phraseData = useMemo(() => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      return null;
    }

    const searchWordsArray = trimmedSearchTerm
      .toLowerCase()
      .split(/\s+/)
      .filter(term => term.length > 0);
    
    const wordsMap = new Map<string, Word>();
    wordsList.forEach(word => {
      wordsMap.set(word.name.toLowerCase(), word);
    });

    const phraseItems: Array<{ type: 'found' | 'missing'; word: Word | string }> = [];
    let hasFoundWords = false;
    let hasMissingWords = false;

    for (const searchWord of searchWordsArray) {
      const matchedWord = wordsMap.get(searchWord);
      if (matchedWord) {
        phraseItems.push({ type: 'found', word: matchedWord });
        hasFoundWords = true;
      } else {
        phraseItems.push({ type: 'missing', word: searchWord });
        hasMissingWords = true;
      }
    }

    return {
      items: phraseItems,
      hasFoundWords,
      hasMissingWords,
      isPhrase: searchWordsArray.length > 1
    };
  }, [searchTerm, wordsList]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando palabras...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased">
      <header className="bg-sky-700 text-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 sm:mb-0">
            SEÑAS
          </h1>
          <h2>
            El Glosario Público de Lengua de Señas Colombiana (LSC)
          </h2>
          <button
            onClick={() => handleOpenAddWordModal()}
            className="flex items-center bg-sky-500 hover:bg-sky-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-opacity-75"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Añadir Palabra
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button 
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ✕
            </button>
          </div>
        )}

        <div className="mb-8">
          <input 
            type="text"
            placeholder="Buscar frase o palabra..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-md mx-auto block px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors text-lg"
            aria-label="Buscar frase o palabra"
          />
        </div>

        {/* Display logic for search results */}
        {searchTerm.trim() ? (
          phraseData ? (
            <>
              {phraseData.isPhrase && phraseData.hasMissingWords && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
                  <p className="font-medium">Frase parcialmente encontrada</p>
                  <p className="text-sm">Se muestran las palabras encontradas y las faltantes que puedes añadir.</p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {phraseData.items.map((item, index) => {
                  if (item.type === 'found') {
                    const word = item.word as Word;
                    console.log(`🎨 [App] Rendering WordCard ${index + 1}:`, word)
                    return (
                      <WordCard 
                        key={`found-${word.id}-${index}`}
                        word={word} 
                        onAddAlternativeSign={() => handleOpenAddWordModal(word.name)} 
                      />
                    );
                  } else {
                    const wordName = item.word as string;
                    console.log(`🎨 [App] Rendering NonWordCard ${index + 1}:`, wordName)
                    return (
                      <NonWordCard
                        key={`missing-${wordName}-${index}`}
                        word={wordName}
                        onAddWord={(word) => handleOpenAddWordModal(word)}
                      />
                    );
                  }
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <VideoCameraIcon className="w-24 h-24 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-slate-600 mb-2">
                Ninguna palabra de tu frase fue encontrada.
              </h2>
              <p className="text-slate-500">
                Verifica la ortografía, intenta con otras palabras, o puedes{' '}
                <button 
                  onClick={() => { setSearchTerm(''); handleOpenAddWordModal(); }}
                  className="text-sky-600 hover:text-sky-700 font-medium underline"
                >
                  añadir las palabras que faltan
                </button>
                .
              </p>
            </div>
          )
        ) : (
          displayedWords.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {displayedWords.map((word, index) => {
                console.log(`🎨 [App] Rendering WordCard ${index + 1}:`, word)
                return (
                  <WordCard 
                    key={`${word.id}-${index}`}
                    word={word} 
                    onAddAlternativeSign={() => handleOpenAddWordModal(word.name)} 
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <VideoCameraIcon className="w-24 h-24 text-slate-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-slate-600 mb-2">
                Aún no hay palabras en la librería.
              </h2>
              <p className="text-slate-500">
                ¡Sé el primero en{' '}
                <button 
                  onClick={() => handleOpenAddWordModal()}
                  className="text-sky-600 hover:text-sky-700 font-medium underline"
                >
                  añadir una nueva palabra
                </button>
                !
              </p>
            </div>
          )
        )}
      </main>

      <footer className="bg-slate-800 text-slate-300 py-6 mt-12 text-center">
        <p className="text-sm text-slate-400 mt-1">
          Hecho con ❤️ para la comunidad.
          <br/>
          Para dudas, correcciones o más información, escríbenos: info@qualiatech.org
        </p>
      </footer>

      <AddWordModal
        isOpen={showAddWordModal}
        onClose={() => { setShowAddWordModal(false); setEditingWordName(null); setNewWordName(null);}}
        onSaveWord={handleSaveWord}
        existingWordName={editingWordName}
        newWordName={newWordName}
      />
    </div>
  );
};

export default App;