
import React from 'react';
import { Word } from '../types';
import { Carousel } from './Carousel';
import { PlusIcon, VideoCameraIcon } from './icons'; // Added VideoCameraIcon import

interface WordCardProps {
  word: Word;
  onAddAlternativeSign: (wordName: string) => void;
}

export const WordCard: React.FC<WordCardProps> = ({ word, onAddAlternativeSign }) => {
  const videoElements = word.signs.map((sign) => (
    <video
      key={sign.id}
      src={sign.dataUrl}
      className="w-full h-full object-cover rounded-md aspect-video bg-slate-200"
      playsInline
      autoPlay
      muted
      loop
      controls={false} // controls can be distracting for "GIF" like videos
    />
  ));

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl">
      <div className="aspect-video w-full bg-slate-200">
        {videoElements.length > 0 ? (
          <Carousel items={videoElements} itemContainerClassName="w-full h-full"/>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <VideoCameraIcon className="w-16 h-16" />
            <span className="ml-2">Sin seña grabada</span>
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-grow">
        <h3 className="text-xl sm:text-2xl font-semibold text-sky-700 mb-2 truncate" title={word.name}>
          {word.name}
        </h3>
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
