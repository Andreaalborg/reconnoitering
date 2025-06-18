'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { MapPin, Calendar, Tag } from 'lucide-react';

interface ExhibitionCardProps {
  exhibition?: {
    _id: string;
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
    coverImage?: string;
    imageUrl?: string;
    startDate: string;
    endDate: string;
    tags?: string[];
    artists?: Array<{ _id: string; name: string }>;
  };
  // Legacy props for backward compatibility
  id?: string;
  title?: string;
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
  coverImage?: string;
  startDate?: string;
  endDate?: string;
  tags?: Array<{ _id: string; name: string }> | string[];
  artists?: Array<{ _id: string; name: string }>;
  minimal?: boolean;
}

const ExhibitionCard = (props: ExhibitionCardProps) => {
  const [imageError, setImageError] = useState(false);
  
  // Handle both new and legacy prop structures
  const exhibition = props.exhibition || {
    _id: props.id || '',
    title: props.title || '',
    venue: props.venue,
    location: props.location,
    coverImage: props.coverImage || props.imageUrl || props.exhibition?.imageUrl || props.exhibition?.coverImage,
    startDate: props.startDate || '',
    endDate: props.endDate || '',
    tags: props.tags,
    artists: props.artists
  };

  const minimal = props.minimal;
  
  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).format(date);
    } catch (error) {
      return '';
    }
  };
  
  // Determine exhibition status
  const getExhibitionStatus = () => {
    try {
      const now = new Date();
      const start = new Date(exhibition.startDate);
      const end = new Date(exhibition.endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return null;
      }
      
      if (now < start) {
        return { status: 'upcoming', label: 'Opening Soon' };
      } else if (now > end) {
        return { status: 'past', label: 'Past' };
      } else {
        return { status: 'ongoing', label: 'Now On' };
      }
    } catch (error) {
      return null;
    }
  };
  
  const exhibitionStatus = getExhibitionStatus();
  const fallbackImage = '/images/placeholder-exhibition.svg';
  const imageSrc = imageError || !exhibition.coverImage ? fallbackImage : exhibition.coverImage;
  
  // Get location display text
  const getLocationText = () => {
    if (exhibition.venue?.name) {
      return `${exhibition.venue.name}, ${exhibition.venue.city || ''}`;
    }
    if (exhibition.location?.name) {
      return `${exhibition.location.name}, ${exhibition.location.city || ''}`;
    }
    return exhibition.location?.city || exhibition.venue?.city || '';
  };

  if (minimal) {
    // Minimal Tate-inspired card design
    return (
      <Link href={`/exhibition/${exhibition._id}`} className="block group">
        <div className="card-minimal overflow-hidden">
          <div className="relative aspect-[4/3] overflow-hidden image-hover">
            <Image 
              src={imageSrc}
              alt={exhibition.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
            {exhibitionStatus && exhibitionStatus.status === 'ongoing' && (
              <div className="absolute top-4 left-4 bg-[var(--secondary)] text-white text-xs px-3 py-1 uppercase tracking-wider">
                {exhibitionStatus.label}
              </div>
            )}
          </div>
          
          <div className="p-6">
            <h3 className="font-serif text-xl mb-2 group-hover:text-[var(--secondary)] transition-colors">
              {exhibition.title}
            </h3>
            
            <div className="space-y-2 text-sm text-[var(--text-muted)]">
              {getLocationText() && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{getLocationText()}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(exhibition.startDate)} – {formatDate(exhibition.endDate)}</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Full card design
  return (
    <Link href={`/exhibition/${exhibition._id}`} className="block group">
      <div className="card-minimal overflow-hidden">
        <div className="relative aspect-[16/9] overflow-hidden image-hover">
          <Image 
            src={imageSrc}
            alt={exhibition.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
          
          {exhibitionStatus && (
            <div className={`absolute top-4 left-4 px-3 py-1 text-xs uppercase tracking-wider ${
              exhibitionStatus.status === 'ongoing' 
                ? 'bg-[var(--secondary)] text-white' 
                : 'bg-white/90 text-black'
            }`}>
              {exhibitionStatus.label}
            </div>
          )}
        </div>
        
        <div className="p-6">
          <h3 className="font-serif text-2xl mb-3 group-hover:text-[var(--secondary)] transition-colors">
            {exhibition.title}
          </h3>
          
          {exhibition.artists && exhibition.artists.length > 0 && (
            <p className="text-lg mb-3">
              {exhibition.artists.map(a => a.name).join(', ')}
            </p>
          )}
          
          <div className="space-y-2 text-sm text-[var(--text-muted)]">
            {getLocationText() && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>{getLocationText()}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(exhibition.startDate)} – {formatDate(exhibition.endDate)}</span>
            </div>
          </div>
          
          {exhibition.tags && exhibition.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border)]">
              <Tag className="w-4 h-4 text-[var(--text-muted)]" />
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(exhibition.tags) ? exhibition.tags : [])
                  .slice(0, 3)
                  .map((tag, index) => (
                    <span key={index} className="text-xs uppercase tracking-wider text-[var(--text-muted)]">
                      {typeof tag === 'string' ? tag : tag.name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ExhibitionCard;