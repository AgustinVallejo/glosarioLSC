
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Word, SignVideo } from './types';
import { WordCard } from './components/WordCard';
import { AddWordModal } from './components/AddWordModal';
import { PlusIcon, VideoCameraIcon } from './components/icons';

const APP_STORAGE_KEY = 'lscWordsLibrary';

const App: React.FC = () => {
  const [wordsList, setWordsList] = useState<Word[]>([]);
  const [showAddWordModal, setShowAddWordModal] = useState(false);
  const [editingWordName, setEditingWordName] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    try {
      const storedWords = localStorage.getItem(APP_STORAGE_KEY);
      if (storedWords) {
        setWordsList(JSON.parse(storedWords));
      }
    } catch (error) {
      console.error("Error loading words from localStorage:", error);
    }
  }, []);

  const saveWordsToLocalStorage = useCallback((updatedWords: Word[]) => {
    try {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(updatedWords));
    } catch (error) {
      console.error("Error saving words to localStorage:", error);
      alert("Error: No se pudo guardar la información. Es posible que el almacenamiento esté lleno.");
    }
  }, []);

  const handleSaveWord = useCallback((wordNameInput: string, mediaDataUrl: string, mediaType: 'video' | 'photo' = 'video') => {
    const newSign: SignVideo = {
      id: crypto.randomUUID(),
      dataUrl: mediaDataUrl,
      timestamp: Date.now(),
      // type: mediaType, // This would be part of SignMedia if types.ts was updated
    };

    setWordsList(prevWordsList => {
      const existingWordIndex = prevWordsList.findIndex(word => word.name.toLowerCase() === wordNameInput.toLowerCase());
      let updatedWordsList;

      if (existingWordIndex > -1) {
        updatedWordsList = prevWordsList.map((word, index) =>
          index === existingWordIndex
            ? { ...word, signs: [...word.signs, newSign].sort((a,b) => b.timestamp - a.timestamp) }
            : word
        );
      } else {
        const newWord: Word = {
          id: crypto.randomUUID(),
          name: wordNameInput,
          signs: [newSign],
        };
        updatedWordsList = [...prevWordsList, newWord];
      }
      
      updatedWordsList.sort((a, b) => a.name.localeCompare(b.name));
      saveWordsToLocalStorage(updatedWordsList);
      return updatedWordsList;
    });

    setShowAddWordModal(false);
    setEditingWordName(null);
  }, [saveWordsToLocalStorage]);

  const handleOpenAddWordModal = (wordName?: string) => {
    if (wordName) {
      setEditingWordName(wordName);
    } else {
      setEditingWordName(null);
    }
    setShowAddWordModal(true);
  };
  
  const displayedWords = useMemo(() => {
    const trimmedSearchTerm = searchTerm.trim();
    if (!trimmedSearchTerm) {
      return wordsList; // wordsList is already sorted alphabetically
    }

    const searchWordsArray = trimmedSearchTerm
      .toLowerCase()
      .split(/\s+/) // Split by one or more spaces
      .filter(term => term.length > 0);
    
    const foundWordsInOrder: Word[] = [];
    // Create a map for quick lookup of words by their lowercase name
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased">
      <header className="bg-sky-700 text-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight mb-2 sm:mb-0">
            Glosario LSC
          </h1>
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

        {displayedWords.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedWords.map((word, index) => (
              <WordCard 
                key={`${word.id}-${index}`} // Ensure unique key if same word appears multiple times
                word={word} 
                onAddAlternativeSign={() => handleOpenAddWordModal(word.name)} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <VideoCameraIcon className="w-24 h-24 text-slate-400 mx-auto mb-4" />
            {(() => {
              const trimmedSearch = searchTerm.trim();
              if (trimmedSearch) { // Active search, but no results from the phrase
                return (
                  <>
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
                  </>
                );
              } else { // No active search, and displayedWords is empty (means wordsList is empty)
                return (
                  <>
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
                  </>
                );
              }
            })()}
          </div>
        )}
      </main>

      <footer className="bg-slate-800 text-slate-300 py-6 mt-12 text-center">
        <p className="text-sm text-slate-400 mt-1">El Glosario Público de palabras y frases de LSC. Hecho con ❤️ para la comunidad sorda y quienes aprenden.</p>
        {/* A button to clear local storage */}
        <button
          onClick={() => {
            if (window.confirm("¿Estás seguro de que quieres borrar todas las palabras guardadas? Esta acción no se puede deshacer.")) {
              localStorage.removeItem(APP_STORAGE_KEY);
              setWordsList([]);
            }
          }}
          className="text-red-400 hover:text-red-500 mt-2" 
        > Borrar Todo</button>
      </footer>

      <AddWordModal
        isOpen={showAddWordModal}
        onClose={() => { setShowAddWordModal(false); setEditingWordName(null);}}
        onSaveWord={(wordName, dataUrl) => handleSaveWord(wordName, dataUrl, 'video')}
        existingWordName={editingWordName}
      />
    </div>
  );
};

export default App;
