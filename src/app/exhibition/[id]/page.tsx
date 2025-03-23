'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/Header';

interface Exhibition {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category: string[];
  artists: string[];
  tags: string[];
  ticketPrice?: string;
  ticketUrl?: string;
  websiteUrl?: string;
}

export default function ExhibitionDetailPage() {
  // Extract ID from pathname instead of using useParams
  const pathname = usePathname();
  const exhibitionId = pathname?.split('/').pop() || '';
  
  const { status } = useSession();
  const router = useRouter();
  
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  
  // Fetch exhibition data
  useEffect(() => {
    const fetchExhibition = async () => {
      if (!exhibitionId) return;
      
      try {
        const response = await fetch(`/api/exhibitions/${exhibitionId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Exhibition not found');
          }
          throw new Error('Failed to fetch exhibition');
        }
        
        const data = await response.json();
        setExhibition(data.data);
      } catch (err) {
        console.error('Error fetching exhibition:', err);
        setError('Failed to load exhibition. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExhibition();
  }, [exhibitionId]);
  
  // Check if exhibition is in user's favorites
  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (status !== 'authenticated' || !exhibition) return;
      
      try {
        const response = await fetch('/api/user/favorites');
        if (!response.ok) {
          throw new Error('Failed to fetch favorites');
        }
        
        const data = await response.json();
        const favorites = data.data || [];
        
        const isFav = favorites.some((fav: any) => fav._id === exhibition._id);
        console.log("Is favorite:", isFav, exhibition._id, favorites);
        setIsFavorite(isFav);
      } catch (err) {
        console.error('Error checking favorite status:', err);
      }
    };
    
    if (status === 'authenticated' && exhibition) {
      checkFavoriteStatus();
    }
  }, [exhibition, status]);
  
  const handleFavoriteToggle = async () => {
    if (status !== 'authenticated') {
      router.push(`/auth/login?callbackUrl=/exhibition/${exhibitionId}`);
      return;
    }
    
    setFavoriteLoading(true);
    
    try {
      const url = `/api/user/favorites/${exhibitionId}`;
      const method = isFavorite ? 'DELETE' : 'POST';
      
      console.log(`Sending ${method} request to ${url}`);
      
      const response = await fetch(url, { 
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        // Ensure credentials are included
        credentials: 'include'
      });
      
      // Always try to parse response regardless of status
      let responseData;
      const responseText = await response.text();
      console.log('API raw response:', responseText);
      
      try {
        responseData = JSON.parse(responseText);
        console.log('API parsed response:', responseData);
      } catch (e) {
        console.error('Error parsing response:', e);
      }
      
      if (!response.ok) {
        console.error('API error status:', response.status);
        throw new Error(responseData?.error || 'Unknown error occurred');
      }
      
      // Success! Update UI
      setIsFavorite(!isFavorite);
      console.log(isFavorite ? 'Removed from favorites' : 'Added to favorites');
      
      // Optional: Show a success message
      alert(isFavorite ? 'Removed from favorites!' : 'Added to favorites!');
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      alert(`Error: ${err.message || 'Could not update favorites. Please try again later.'}`);
    } finally {
      setFavoriteLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        </main>
      </div>
    );
  }
  
  if (error || !exhibition) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Exhibition Not Found</h1>
            <p className="mt-4 text-lg text-gray-600">The exhibition you're looking for doesn&apos;t exist or has been removed.</p>
            <Link href="/exhibitions" className="mt-8 inline-block bg-rose-500 text-white px-6 py-3 rounded-md">
              Browse All Exhibitions
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  const startDate = formatDate(exhibition.startDate);
  const endDate = formatDate(exhibition.endDate);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/exhibitions" className="inline-flex items-center text-rose-500 hover:text-rose-700 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Exhibitions
        </Link>
        
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          <div className="relative h-96 w-full">
            <Image 
              src={exhibition.coverImage}
              alt={exhibition.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            
            {/* Favorite button */}
            <button
              onClick={handleFavoriteToggle}
              disabled={favoriteLoading}
              className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition-colors"
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {favoriteLoading ? (
                <svg className="animate-spin h-6 w-6 text-rose-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : isFavorite ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-rose-500">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-rose-500">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                </svg>
              )}
            </button>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{exhibition.title}</h1>
                <p className="text-lg text-gray-600">
                  {exhibition.location.name}, {exhibition.location.city}, {exhibition.location.country}
                </p>
              </div>
              
              <div className="mt-4 md:mt-0 bg-gray-100 rounded-lg p-4">
                <p className="font-medium">Dates</p>
                <p className="text-gray-600">{startDate} - {endDate}</p>
                {exhibition.ticketPrice && (
                  <>
                    <p className="font-medium mt-2">Ticket Price</p>
                    <p className="text-gray-600">{exhibition.ticketPrice}</p>
                  </>
                )}
                {exhibition.ticketUrl && (
                  <a 
                    href={exhibition.ticketUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 block text-center bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded"
                  >
                    Buy Tickets
                  </a>
                )}
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold mb-4">About This Exhibition</h2>
              <p className="text-gray-700 mb-6 whitespace-pre-line">{exhibition.description}</p>
              
              {/* Rest of the content remains the same */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}