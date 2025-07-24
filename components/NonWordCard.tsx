import React from 'react';
import { PlusIcon } from './icons';

interface NonWordCardProps {
  word: string;
  onAddWord: (wordName: string) => void;
}

export const NonWordCard: React.FC<NonWordCardProps> = ({ word, onAddWord }) => {
  const handleClick = () => {
    onAddWord(word);
  };

  return (
    <div className="card-enhanced border-2 border-purple-200 rounded-lg shadow-sm overflow-hidden flex flex-col transition-all duration-300 hover:shadow-md hover:border-purple-300 group cursor-pointer" onClick={handleClick}>
      <div className="aspect-video w-full bg-purple-50 flex items-center justify-center relative">
        <div className="text-purple-400 group-hover:text-purple-600 transition-colors duration-300">
          <PlusIcon className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
        </div>
        <div className="absolute inset-0 bg-purple-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-purple-700 group-hover:text-purple-800 transition-colors truncate flex-grow">
            {word}
          </h3>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClick();
            }}
            className="ml-2 p-1 text-purple-500 hover:text-purple-700 hover:bg-purple-50 rounded-full transition-all duration-200 group-hover:scale-110"
            title={`Añadir "${word}"`}
          >
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-purple-500 mt-1 group-hover:text-purple-600 transition-colors">
          Toca para añadir
        </p>
      </div>
    </div>
  );
};
