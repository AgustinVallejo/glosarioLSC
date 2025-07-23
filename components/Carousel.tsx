
import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';

interface CarouselProps {
  items: React.ReactNode[];
  itemContainerClassName?: string;
}

export const Carousel: React.FC<CarouselProps> = ({ items, itemContainerClassName }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) {
    return <div className="text-center text-slate-500">No hay elementos para mostrar.</div>;
  }

  const goToPrevious = () => {
    const isFirstItem = currentIndex === 0;
    const newIndex = isFirstItem ? items.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastItem = currentIndex === items.length - 1;
    const newIndex = isLastItem ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  return (
    <div className="relative w-full">
      <div className={itemContainerClassName || "w-full h-full flex justify-center items-center"}>
        {items[currentIndex]}
      </div>
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-1 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-opacity focus:outline-none"
            aria-label="Anterior"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-1 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white p-2 rounded-full transition-opacity focus:outline-none"
            aria-label="Siguiente"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
            {currentIndex + 1} / {items.length}
          </div>
        </>
      )}
    </div>
  );
};
