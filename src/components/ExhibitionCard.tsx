'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';

interface ExhibitionCardProps {
  id: string;
  title: string;
  venue?: {
    name: string;
    city: string;
    country: string;
  };
  location?: {
    name?: string;
    city?: string;
    country?: string;
  };
  imageUrl?: string;
  coverImage?: string; // For kompatibilitet med eldre komponenter
  startDate: string;
  endDate: string;
  tags?: Array<{ _id: string; name: string }>;
  artists?: Array<{ _id: string; name: string }>;
}

const ExhibitionCard = ({ 
  id, 
  title, 
  venue,
  location, 
  imageUrl, 
  coverImage, // Støtte for begge bildeformater
  startDate, 
  endDate,
  tags,
  artists
}: ExhibitionCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Format date for display with error handling
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date unavailable';
      }
      return new Intl.DateTimeFormat('no-NO', { 
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
        return { status: 'upcoming', label: 'Kommende', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      } else if (now > end) {
        return { status: 'past', label: 'Avsluttet', color: 'bg-gray-100 text-gray-800 border-gray-200' };
      } else {
        return { status: 'ongoing', label: 'Pågår nå', color: 'bg-green-100 text-green-800 border-green-200' };
      }
    } catch (error) {
      return null;
    }
  };
  
  const exhibitionStatus = getExhibitionStatus();
  
  // Bruk et fast plassholderbilde
  const fallbackImage = '/images/placeholder-exhibition.svg';

  // Determine image source (støtte for både imageUrl og coverImage)
  const actualImageUrl = imageUrl || coverImage || '';
  const imageSrc = imageError || !actualImageUrl ? fallbackImage : actualImageUrl;
  
  // Get location display text
  const getLocationText = () => {
    if (venue?.name) {
      return `${venue.name}, ${venue.city || ''}`;
    }
    if (location?.name) {
      return `${location.name}, ${location.city || ''}`;
    }
    return location?.city || 'Ukjent sted';
  };
  
  return (
    <Link href={`/exhibition/${id}`} className="block h-full group">
      <div className="rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white h-full flex flex-col card-hover">
        <div className="relative h-48 w-full overflow-hidden">
          <Image 
            src={imageSrc}
            alt={`Bilde av ${title} utstilling`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {exhibitionStatus && (
            <div className={`absolute top-3 left-3 ${exhibitionStatus.color} text-xs px-3 py-1.5 rounded-full font-medium border backdrop-blur-sm`}>
              {exhibitionStatus.label}
            </div>
          )}
        </div>
        
        <div className="p-5 flex-grow flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-rose-600 transition-colors" title={title}>
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-3">
            📍 {getLocationText()}
          </p>
          
          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.slice(0, 3).map(tag => (
                <span key={tag._id} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {tag.name}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-gray-500">+{tags.length - 3}</span>
              )}
            </div>
          )}
          
          {/* Artists */}
          {artists && artists.length > 0 && (
            <p className="text-sm text-gray-600 mb-3">
              🎨 {artists.map(a => a.name).join(', ')}
            </p>
          )}
          
          <div className="flex justify-between items-center mt-auto pt-3 border-t border-gray-100">
            <span className="text-gray-500 text-sm">
              📅 {formatDate(startDate)} - {formatDate(endDate)}
            </span>
            <span className="text-rose-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Se mer →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ExhibitionCard;