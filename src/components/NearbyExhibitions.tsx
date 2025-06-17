'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import ExhibitionCard from '@/components/ExhibitionCard';
import Link from 'next/link';

interface Exhibition {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  distance?: number; // Added distance property
}

export default function NearbyExhibitionsPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'loading' | 'granted' | 'denied' | 'unavailable'>('loading');
  const [radius, setRadius] = useState<number>(10); // Default radius in km
  
  // Get user's location
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      setError('Geolocation is not supported by your browser');
      setLoading(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus('granted');
      },
      (error) => {
        console.error('Error getting user location:', error);
        setLocationStatus('denied');
        setError('Unable to access your location. Please enable location access to see nearby exhibitions.');
        setLoading(false);
      }
    );
  }, []);
  
  // Fetch exhibitions when user location is available
  useEffect(() => {
    if (!userLocation) return;
    
    const fetchNearbyExhibitions = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // In a real application, you would call an API with the user's coordinates
        // For this example, we'll simulate the API call and filter exhibitions client-side
        const response = await fetch('/api/exhibitions');
        if (!response.ok) {
          throw new Error('Failed to fetch exhibitions');
        }
        
        const data = await response.json();
        const allExhibitions = data.data as Exhibition[];
        
        // Filter exhibitions with coordinates and calculate distance
        const exhibitionsWithDistance = allExhibitions
          .filter(ex => ex.location && 
                  ex.location.coordinates && 
                  ex.location.coordinates.lat !== undefined && 
                  ex.location.coordinates.lng !== undefined &&
                  typeof ex.location.coordinates.lat === 'number' &&
                  typeof ex.location.coordinates.lng === 'number')
          .map(ex => {
            const distance = calculateDistance(
              userLocation.lat,
              userLocation.lng,
              ex.location.coordinates!.lat,
              ex.location.coordinates!.lng
            );
            
            return { ...ex, distance };
          })
          // Filter by radius (in km)
          .filter(ex => ex.distance! <= radius)
          // Sort by distance (closest first)
          .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
        
        setExhibitions(exhibitionsWithDistance);
      } catch (err) {
        console.error('Error fetching nearby exhibitions:', err);
        setError('Failed to load exhibitions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchNearbyExhibitions();
  }, [userLocation, radius]);
  
  // Haversine formula to calculate distance between two coordinates in kilometers
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return parseFloat(distance.toFixed(1));
  };
  
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };
  
  const handleRadiusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRadius(parseInt(e.target.value));
  };
  
  const renderContent = () => {
    if (locationStatus === 'loading') {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Detecting your location...</p>
          </div>
        </div>
      );
    }
    
    if (locationStatus === 'denied' || locationStatus === 'unavailable') {
      return (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error || 'Location access is required to find nearby exhibitions.'}
              </p>
              <p className="mt-2">
                <button 
                  className="text-sm font-medium text-yellow-700 underline"
                  onClick={() => window.location.reload()}
                >
                  Try again
                </button>
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
          {error}
        </div>
      );
    }
    
    if (exhibitions.length === 0) {
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">No exhibitions found nearby</h2>
          <p className="text-gray-500 mb-4">Try increasing the search radius or explore exhibitions in other areas.</p>
          <Link 
            href="/exhibitions" 
            className="inline-block bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600"
          >
            Browse All Exhibitions
          </Link>
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {exhibitions.map((exhibition) => (
          <div key={exhibition._id} className="relative">
            <ExhibitionCard
              id={exhibition._id}
              title={exhibition.title}
              location={exhibition.location}
              coverImage={exhibition.coverImage}
              startDate={exhibition.startDate}
              endDate={exhibition.endDate}
            />
            {exhibition.distance !== undefined && (
              <div className="absolute top-2 left-2 bg-white py-1 px-2 rounded-full shadow text-sm font-medium">
                {exhibition.distance} km
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Exhibitions Near You</h1>
          
          {locationStatus === 'granted' && (
            <div className="bg-white p-2 rounded-lg shadow">
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                Search Radius
              </label>
              <select
                id="radius"
                value={radius}
                onChange={handleRadiusChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
                <option value="100">100 km</option>
              </select>
            </div>
          )}
        </div>
        
        {userLocation && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Using your current location to find exhibitions within {radius} km.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {renderContent()}
      </main>
    </div>
  );
}