'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ExhibitionCardProps {
  id: string;
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

const ExhibitionCard = ({ 
  id, 
  title, 
  location, 
  coverImage, 
  startDate, 
  endDate 
}: ExhibitionCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Format date for display with error handling
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date unavailable';
      }
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }).format(date);
    } catch (error) {
      console.error('Error formatting date:');
      return 'Date unavailable';
    }
  };
  
  // Determine exhibition status
  const getExhibitionStatus = () => {
    try {
      const now = new Date();
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
      }
      
      if (now < start) {
        return { status: 'upcoming', label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
      } else if (now > end) {
        return { status: 'past', label: 'Past', color: 'bg-gray-100 text-gray-800' };
      } else {
        return { status: 'ongoing', label: 'Now Showing', color: 'bg-green-100 text-green-800' };
      }
    } catch (error) {
      return null;
    }
  };
  
  const exhibitionStatus = getExhibitionStatus();
  
  // Fallback image if the provided one fails
  const fallbackImage = "https://picsum.photos/seed/" + id + "/800/600";
  
  return (
    <Link href={`/exhibition/${id}`} className="block h-full">
      <div className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 bg-white h-full flex flex-col">
        <div className="relative h-48 w-full">
          <Image 
            src={imageError ? fallbackImage : coverImage}
            alt={`Image of ${title} exhibition`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 hover:scale-105"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          
          {exhibitionStatus && (
            <div className={`absolute top-2 left-2 ${exhibitionStatus.color} text-xs px-2 py-1 rounded-full font-medium`}>
              {exhibitionStatus.label}
            </div>
          )}
        </div>
        
        <div className="p-4 flex-grow flex flex-col">
          <h3 className="font-bold text-lg text-gray-800 truncate" title={title}>
            {title}
          </h3>
          <p className="text-gray-600 text-sm">
            {location.name}, {location.city}
          </p>
          <div className="flex justify-between items-center mt-auto pt-2">
            <span className="text-gray-500 text-sm">
              {formatDate(startDate)} - {formatDate(endDate)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ExhibitionCard;