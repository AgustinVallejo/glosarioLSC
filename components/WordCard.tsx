
import React, { useState } from 'react';
import { Word, getNearestCityText, isDevelopmentEnvironment } from '../types';
import { PlusIcon, VideoCameraIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface WordCardProps {
  word: Word;
  onAddAlternativeSign: (wordName: string) => void;
}

export const WordCard: React.FC<WordCardProps> = ({ word, onAddAlternativeSign }) => {
  const [currentSignIndex, setCurrentSignIndex] = useState(0);
  const isDev = isDevelopmentEnvironment();
  
  console.log('🎨 [WordCard] Rendering word:', word.name, 'with', word.signs.length, 'signs')
  console.log('🎨 [WordCard] Word data:', word)

  const goToPrevious = () => {
    const isFirstSign = currentSignIndex === 0;
    const newIndex = isFirstSign ? word.signs.length - 1 : currentSignIndex - 1;
    setCurrentSignIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSign = currentSignIndex === word.signs.length - 1;
    const newIndex = isLastSign ? 0 : currentSignIndex + 1;
    setCurrentSignIndex(newIndex);
  };

  const currentSign = word.signs[currentSignIndex];

  return (
    <div className="card-enhanced rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl border-white/20">
      <div className="aspect-video w-full bg-slate-200 relative">
        {word.signs.length > 0 ? (
          <>
            <video
              src={currentSign.video_url}
              className="w-full h-full object-cover rounded-md aspect-video bg-slate-200"
              playsInline
              autoPlay
              muted
              loop
              controls={false}
              onLoadStart={() => console.log(`🎬 [WordCard] Video started loading:`, currentSign.video_url)}
              onError={(e) => console.error(`❌ [WordCard] Video error:`, e, 'URL:', currentSign.video_url)}
            />
            {word.signs.length > 1 && (
              <>
                <button
                  onClick={goToPrevious}
                  className="absolute top-1/2 left-1 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-opacity focus:outline-none"
                  aria-label="Seña anterior"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={goToNext}
                  className="absolute top-1/2 right-1 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-opacity focus:outline-none"
                  aria-label="Seña siguiente"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                  {currentSignIndex + 1} / {word.signs.length}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <VideoCameraIcon className="w-16 h-16" />
            <span className="ml-2">Sin seña grabada</span>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl sm:text-2xl font-semibold text-sky-700 truncate" title={word.name}>
            {word.name}
          </h3>
          {/* Test indicator in development mode */}
          {isDev && currentSign?.test && (
            <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full font-medium ml-2 flex-shrink-0">
              TEST
            </span>
          )}
        </div>
        
        {/* Metadatos de la seña actual */}
        {currentSign && (currentSign.note || currentSign.location) && (
          <div className="mb-3 space-y-1">
            {currentSign.note && (
              <p className="text-xs text-slate-500 italic">
                💭 {currentSign.note}
              </p>
            )}
            {currentSign.location && (
              <p className="text-xs text-slate-500">
                📍 {getNearestCityText(currentSign.location.latitude, currentSign.location.longitude, currentSign.location.city)}
              </p>
            )}
          </div>
        )}
        
        <button
          onClick={() => onAddAlternativeSign(word.name)}
          className="mt-auto w-full flex items-center justify-center text-sm bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-3 rounded-lg transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-opacity-75"
        >
          <PlusIcon className="w-4 h-4 mr-1.5" />
          Añadir Seña Alternativa
        </button>
      </div>
    </div>
  );
};
