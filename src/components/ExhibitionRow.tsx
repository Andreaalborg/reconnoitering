'use client';

import { useRef } from 'react';
import Link from 'next/link';
import ExhibitionCard from './ExhibitionCard';

interface Exhibition {
  _id: string;
  title: string;
  location: {
    name: string;
    city: string;
    country: string;
  };
  coverImage: string;
  startDate: string;
  endDate: string;
}

interface ExhibitionRowProps {
  title: string;
  exhibitions: Exhibition[];
  viewAllLink?: string;
}

const ExhibitionRow = ({ title, exhibitions, viewAllLink }: ExhibitionRowProps) => {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { current } = rowRef;
      const scrollAmount = direction === 'left' 
        ? -current.offsetWidth / 2 
        : current.offsetWidth / 2;
      
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!exhibitions || exhibitions.length === 0) {
    return null;
  }

  return (
    <section className="my-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
        
        {viewAllLink && (
          <Link href={viewAllLink} className="text-rose-500 hover:underline">
            Show all
          </Link>
        )}
      </div>
      
      <div className="relative">
        {exhibitions.length > 3 && (
          <>
            <button 
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-200"
              aria-label="Scroll left"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            
            <button 
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow duration-200"
              aria-label="Scroll right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </>
        )}
        
        <div 
          ref={rowRef}
          className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar"
        >
          {exhibitions.map((exhibition) => (
            <div key={exhibition._id} className="flex-none w-64">
              <ExhibitionCard
                id={exhibition._id}
                title={exhibition.title}
                location={exhibition.location}
                coverImage={exhibition.coverImage}
                startDate={exhibition.startDate}
                endDate={exhibition.endDate}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExhibitionRow;