// src/app/map/page.tsx
'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import GoogleMap from '@/components/GoogleMap';

// Updated interface for Venue data for map markers
interface MapVenue {
  _id: string;
  name: string;
  city: string;
  country: string;
  coordinates: { 
    lat: number;
    lng: number;
  };
}

function MapPageContent() {
  const router = useRouter();
  
  // Default center (Oslo)
  const DEFAULT_CENTER = { lat: 59.9139, lng: 10.7522 };
  
  const [venues, setVenues] = useState<MapVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [initialCenterSet, setInitialCenterSet] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
          setInitialCenterSet(true); 
        },
        (error) => {
          console.error('Error getting geolocation:', error);
          setMapCenter(DEFAULT_CENTER);
          setInitialCenterSet(true); 
        },
        { timeout: 10000 }
      );
    } else {
      console.warn('Geolocation is not supported by this browser.');
      setMapCenter(DEFAULT_CENTER);
      setInitialCenterSet(true); 
    }
  }, []);

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching venues for map from /api/venues...");
      const response = await fetch(`/api/venues`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch venues');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVenues(data.data || []);
      } else {
        throw new Error(data.error || 'Failed to fetch venues');
      }
    } catch (err: any) {
      console.error('Error fetching venues for map:', err);
      setError(err.message || 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  const handlePlaceSelected = useCallback((place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      const newCenter = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setMapCenter(newCenter);
    }
  }, []);
  
  const handleMapDragEnd = useCallback((center: { lat: number; lng: number }) => {
  }, []);

  const mapMarkers = venues.map(venue => ({
    id: venue._id,
    position: venue.coordinates,
    title: venue.name,
    info: `${venue.city}, ${venue.country}`,
  }));
  
  if (!initialCenterSet || !mapCenter) { 
     return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div>Getting location and loading map...</div>
      </div>
    ); 
  }

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Venue Map</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading && !venues.length ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-red-500">{error}</div>
          ) : (
            <div className="h-[600px]">
              <GoogleMap
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                center={mapCenter}
                zoom={12}
                markers={mapMarkers}
                showSearchBox={true}
                onPlaceSelected={handlePlaceSelected}
                height="600px"
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}

export default function MapPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
        <MapPageContent />
      </Suspense>
    </div>
  );
}