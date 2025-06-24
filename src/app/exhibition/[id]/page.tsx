// src/app/exhibition/[id]/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import CalendarExportButtons from '@/components/CalendarExportButtons';
import GoogleMap from '@/components/GoogleMap';

interface Exhibition {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  startDate: string;
  endDate: string;
  venue?: {
    _id: string;
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    defaultClosedDays?: string[];
  };
  location?: {
    city: string;
    country: string;
  };
  category: string[];
  artists: string[];
  tags: string[];
  ticketPrice?: string;
  ticketUrl?: string;
  websiteUrl?: string;
  closedDay?: string;
}

function ExhibitionDetailContent() {
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
  const [showMap, setShowMap] = useState(false);
  
  // Fetch exhibition data
  useEffect(() => {
    const fetchExhibition = async () => {
      if (!exhibitionId) return;
      
      try {
        console.log(`Fetching exhibition with ID: ${exhibitionId}`);
        const response = await fetch(`/api/exhibitions/${exhibitionId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          console.error('API Error Response:', response.status, errorData);
          
          if (response.status === 404) {
            throw new Error('Exhibition not found');
          }
          throw new Error(`Could not fetch exhibition: ${errorData?.error || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Exhibition data received:', data);
        
        if (!data.success || !data.data) {
          throw new Error('Invalid data format from API');
        }
        
        // Ensure required arrays exist
        const exhibition = {
          ...data.data,
          artists: data.data.artists || [],
          category: data.data.category || [],
          tags: data.data.tags || [],
          images: data.data.images || []
        };
        
        setExhibition(exhibition);
      } catch (err) {
        console.error('Error fetching exhibition:', err);
        setError(`Could not load exhibition. ${err instanceof Error ? err.message : 'Try again later.'}`);
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
  
  // Get day of week name
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  // Handle single day exhibition booking
  const handleBookOnDate = (date: string) => {
    router.push(`/date-search?date=${date}&exhibitions=${exhibitionId}`);
  };
  
  // Get location display text
  const getLocationText = () => {
    if (!exhibition) return 'Unknown location';
    if (exhibition.venue?.name) {
      return `${exhibition.venue.name}, ${exhibition.venue.city}, ${exhibition.venue.country}`;
    }
    return `${exhibition.location?.city || 'Unknown location'}, ${exhibition.location?.country || ''}`;
  };
  
  // Check if today is the weekly closing day
  const todayDayOfWeek = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const isClosedToday = exhibition?.venue?.defaultClosedDays?.includes(todayDayOfWeek) || 
                       exhibition?.closedDay === todayDayOfWeek;
  
  // Sørg for at venue og location håndteres riktig for kartet
  const getMapCoordinates = () => {
    if (exhibition?.venue?.coordinates?.lat && exhibition?.venue?.coordinates?.lng) {
      return {
        lat: exhibition.venue.coordinates.lat,
        lng: exhibition.venue.coordinates.lng
      };
    }
    return { lat: 0, lng: 0 }; // Standardverdi hvis koordinater mangler
  };
  
  // Få riktig navninformasjon for kartet
  const getVenueInfoForMap = () => {
    if (exhibition?.venue?.name) {
      return exhibition.venue.name;
    }
    if (exhibition?.location?.city) {
      return exhibition.location.city;
    }
    return 'Unknown location';
  };
  
  // Hjelpefunksjon for å sikre at bildeadresser er gyldige
  const getValidImageUrl = (imageUrl?: string): string => {
    if (!imageUrl || imageUrl === '') {
      return '/images/placeholder-exhibition.svg';
    }
    return imageUrl;
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Exhibition not found</h1>
            <p className="mt-4 text-lg text-gray-600">The exhibition you&apos;re looking for does not exist or has been removed.</p>
            <Link href="/exhibitions" className="mt-8 inline-block bg-rose-500 text-white px-6 py-3 rounded-md">
              Browse all exhibitions
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  const startDate = formatDate(exhibition.startDate);
  const endDate = formatDate(exhibition.endDate);
  
  // Check if exhibition has location coordinates for map
  const hasCoordinates = exhibition.venue?.coordinates?.lat && exhibition.venue?.coordinates?.lng;
  
  // Check if today is during the exhibition period
  const today = new Date();
  const isCurrentlyRunning = new Date(exhibition.startDate) <= today && today <= new Date(exhibition.endDate);
  
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/exhibitions" className="inline-flex items-center text-rose-500 hover:text-rose-700 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to exhibitions
        </Link>
        
        <div className="bg-white rounded-xl overflow-hidden shadow-lg">
          <div className="relative h-96 w-full">
            <Image 
              src={getValidImageUrl(exhibition.coverImage)}
              alt={exhibition.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            
            {/* Exhibition status badges */}
            <div className="absolute top-4 left-4 flex flex-col space-y-2">
              {isCurrentlyRunning && (
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                  Ongoing
                </span>
              )}
              
              {isCurrentlyRunning && isClosedToday && (
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
                  Closed today
                </span>
              )}
            </div>
            
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
                  {getLocationText()}
                </p>
                
                {/* Display closed days from venue */}
                {exhibition.venue?.defaultClosedDays && exhibition.venue.defaultClosedDays.length > 0 && (
                  <p className="mt-2 text-amber-600">
                    <span className="font-medium">
                      {exhibition.venue.defaultClosedDays.length === 1 
                        ? `Closed on ${exhibition.venue.defaultClosedDays[0]}s`
                        : exhibition.venue.defaultClosedDays.length === 2
                        ? `Closed on ${exhibition.venue.defaultClosedDays[0]}s and ${exhibition.venue.defaultClosedDays[1]}s`
                        : `Closed on ${exhibition.venue.defaultClosedDays.slice(0, -1).join('s, ')}s and ${exhibition.venue.defaultClosedDays[exhibition.venue.defaultClosedDays.length - 1]}s`
                      }
                    </span>
                  </p>
                )}
              </div>
              
              <div className="mt-4 md:mt-0 bg-gray-100 rounded-lg p-4">
                <p className="font-medium">Dates</p>
                <p className="text-gray-600">{startDate} - {endDate}</p>
                {exhibition.ticketPrice && (
                  <>
                    <p className="font-medium mt-2">Ticket price</p>
                    <p className="text-gray-600">{exhibition.ticketPrice}</p>
                  </>
                )}
                
                <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  {isCurrentlyRunning && !isClosedToday && (
                    <button
                      onClick={() => handleBookOnDate(new Date().toISOString().split('T')[0])}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded text-sm"
                    >
                      Visit today
                    </button>
                  )}
                  
                  {exhibition.ticketUrl && (
                    <a 
                      href={exhibition.ticketUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded text-center text-sm"
                    >
                      Buy tickets
                    </a>
                  )}
                  
                  <CalendarExportButtons exhibition={exhibition} />
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-bold mb-4">About this exhibition</h2>
              <p className="text-gray-700 mb-6 whitespace-pre-line">{exhibition.description}</p>
              
              {/* Additional details section - artists, categories, etc. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-bold mb-2">Artists</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {exhibition.artists && exhibition.artists.length > 0 ? (
                      exhibition.artists.map((artist, index) => (
                        <li key={index}>{artist}</li>
                      ))
                    ) : (
                      <li>No artists listed</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold mb-2">Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {exhibition.category && exhibition.category.length > 0 ? (
                      exhibition.category.map((category, index) => (
                        <span key={index} className="bg-rose-100 text-rose-800 px-2 py-1 rounded-full text-sm">
                          {category}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No categories listed</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Map section */}
              {hasCoordinates && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Location</h3>
                    <button 
                      onClick={() => setShowMap(!showMap)} 
                      className="text-rose-500 hover:text-rose-700 text-sm font-medium"
                    >
                      {showMap ? 'Hide map' : 'Show map'}
                    </button>
                  </div>
                  
                  {showMap && hasCoordinates && (
                    <div className="h-80 rounded-lg overflow-hidden mb-4">
                      <GoogleMap
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                        center={getMapCoordinates()}
                        zoom={15}
                        markers={[{
                          id: exhibition._id,
                          position: getMapCoordinates(),
                          title: exhibition.title,
                          info: getVenueInfoForMap()
                        }]}
                        height="320px"
                      />
                    </div>
                  )}
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{exhibition.venue?.name || exhibition.location?.city || 'Unknown location'}</p>
                    <p className="text-gray-600">{exhibition.venue?.address || ''}</p>
                    <p className="text-gray-600">
                      {exhibition.location?.city || exhibition.venue?.city || ''}{exhibition.location?.city || exhibition.venue?.city ? ', ' : ''}
                      {exhibition.location?.country || exhibition.venue?.country || ''}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Additional images */}
              {exhibition.images && exhibition.images.length > 0 && exhibition.images.some(img => !!img) && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Gallery</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {exhibition.images
                      .filter(image => image && image !== '')
                      .map((image, index) => (
                        <div key={index} className="relative h-32 rounded-lg overflow-hidden">
                          <Image 
                            src={getValidImageUrl(image)}
                            alt={`${exhibition.title} image ${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              {/* Plan your visit section */}
              <div className="mb-6 bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-bold mb-3">Plan your visit</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Opening hours</h4>
                    <p className="text-gray-700 mb-2">
                      This exhibition is open from {startDate} to {endDate}.
                    </p>
                    {exhibition.venue?.defaultClosedDays && exhibition.venue.defaultClosedDays.length > 0 && (
                      <p className="text-gray-700 mb-2">
                        <span className="font-medium">
                          {exhibition.venue.defaultClosedDays.length === 1 
                            ? `Closed on ${exhibition.venue.defaultClosedDays[0]}s`
                            : exhibition.venue.defaultClosedDays.length === 2
                            ? `Closed on ${exhibition.venue.defaultClosedDays[0]}s and ${exhibition.venue.defaultClosedDays[1]}s`
                            : `Closed on ${exhibition.venue.defaultClosedDays.slice(0, -1).join('s, ')}s and ${exhibition.venue.defaultClosedDays[exhibition.venue.defaultClosedDays.length - 1]}s`
                          }
                        </span>
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Please check the official website for specific opening hours and any special closures.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-blue-800 mb-2">Add to itinerary</h4>
                    <p className="text-gray-700 mb-3">
                      Planning a visit? Choose a date to add this exhibition to your day plan:
                    </p>
                    
                    <div className="flex items-center space-x-2">
                      <input 
                        type="date" 
                        className="p-2 border border-gray-300 rounded" 
                        min={exhibition.startDate.split('T')[0]}
                        max={exhibition.endDate.split('T')[0]}
                        defaultValue={isCurrentlyRunning ? new Date().toISOString().split('T')[0] : exhibition.startDate.split('T')[0]}
                        id="visit-date"
                      />
                      <button
                        onClick={() => {
                          const date = (document.getElementById('visit-date') as HTMLInputElement).value;
                          handleBookOnDate(date);
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                      >
                        Add to plan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* External links */}
              {exhibition.websiteUrl && (
                <div className="mt-6">
                  <a 
                    href={exhibition.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-rose-500 hover:text-rose-700"
                  >
                    <span>Visit exhibition website</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}
              
              {/* Tags at the bottom */}
              {exhibition.tags && exhibition.tags.length > 0 && (
                <div className="mt-8 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {exhibition.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ExhibitionDetailPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <ExhibitionDetailContent />
    </Suspense>
  );
}