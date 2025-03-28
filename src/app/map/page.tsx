// src/app/map/page.tsx
'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import GoogleMap from '@/components/GoogleMap';

interface Exhibition {
  _id: string;
  title: string;
  description: string;
  location: {
    name: string;
    city: string;
    country: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  startDate: string;
  endDate: string;
  category: string[];
  closedDay?: string; // Added for weekly closing day
}

function MapPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get search parameters
  const lat = parseFloat(searchParams.get('lat') || '48.8566'); // Default to Paris
  const lng = parseFloat(searchParams.get('lng') || '2.3522');
  const radiusParam = parseInt(searchParams.get('radius') || '10');
  const cityParam = searchParams.get('city') || '';
  const categoryParam = searchParams.get('category') || '';
  
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number }>({ lat, lng });
  const [radius, setRadius] = useState(radiusParam);
  const [selectedCity, setSelectedCity] = useState(cityParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [showFilters, setShowFilters] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Load exhibitions
  useEffect(() => {
    fetchExhibitions();
  }, [userLocation, radius, selectedCity, selectedCategory]);
  
  const fetchExhibitions = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      
      // Add location-based parameters
      if (userLocation) {
        params.append('lat', userLocation.lat.toString());
        params.append('lng', userLocation.lng.toString());
        params.append('radius', radius.toString());
      }
      
      // Add filters
      if (selectedCity) params.append('city', selectedCity);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/exhibitions/nearby?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setExhibitions(data.data || []);
        
        // Extract filter options if available
        if (data.meta && data.meta.filter_options) {
          setCities(data.meta.filter_options.cities || []);
          setCategories(data.meta.filter_options.categories || []);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch exhibitions');
      }
    } catch (err: any) {
      console.error('Error fetching exhibitions:', err);
      setError(err.message || 'Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };
  
  // Map center changed
  const handleMapDragEnd = (center: { lat: number; lng: number }) => {
    setUserLocation(center);
    
    // Update URL
    const params = new URLSearchParams(searchParams.toString());
    params.set('lat', center.lat.toString());
    params.set('lng', center.lng.toString());
    router.push(`/map?${params.toString()}`);
  };
  
  // Place selected from search
  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      const newLocation = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      };
      setUserLocation(newLocation);
      
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set('lat', newLocation.lat.toString());
      params.set('lng', newLocation.lng.toString());
      router.push(`/map?${params.toString()}`);
    }
  };
  
  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    params.set('lat', userLocation.lat.toString());
    params.set('lng', userLocation.lng.toString());
    params.set('radius', radius.toString());
    
    if (selectedCity) params.set('city', selectedCity);
    if (selectedCategory) params.set('category', selectedCategory);
    
    router.push(`/map?${params.toString()}`);
    setShowFilters(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedCity('');
    setSelectedCategory('');
    
    const params = new URLSearchParams();
    params.set('lat', userLocation.lat.toString());
    params.set('lng', userLocation.lng.toString());
    params.set('radius', radius.toString());
    
    router.push(`/map?${params.toString()}`);
    setShowFilters(false);
  };
  
  // Prepare markers for Google Map
  const mapMarkers = exhibitions
    .filter(ex => ex.location.coordinates && ex.location.coordinates.lat && ex.location.coordinates.lng)
    .map(ex => ({
      id: ex._id,
      position: {
        lat: ex.location.coordinates!.lat,
        lng: ex.location.coordinates!.lng
      },
      title: ex.title,
      info: `${ex.location.name}${ex.closedDay ? ` (Closed on ${ex.closedDay}s)` : ''}`,
      link: `/exhibition/${ex._id}`
    }));
  
  return (
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Exhibition Map</h1>
          
          <div className="flex space-x-4">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600 transition-colors"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            
            <button
              onClick={() => {
                if (navigator.geolocation) {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      const { latitude, longitude } = position.coords;
                      setUserLocation({ lat: latitude, lng: longitude });
                      
                      // Update URL
                      const params = new URLSearchParams(searchParams.toString());
                      params.set('lat', latitude.toString());
                      params.set('lng', longitude.toString());
                      router.push(`/map?${params.toString()}`);
                    },
                    (error) => {
                      console.error('Error getting location:', error);
                      alert('Unable to get your location. Please enter it manually.');
                    }
                  );
                } else {
                  alert('Geolocation is not supported by your browser');
                }
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
            >
              Use My Location
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Filter Exhibitions</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-1">
                  Search Radius (km)
                </label>
                <input
                  type="range"
                  id="radius"
                  min="1"
                  max="100"
                  value={radius}
                  onChange={(e) => setRadius(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>1km</span>
                  <span>{radius}km</span>
                  <span>100km</span>
                </div>
              </div>
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <select
                  id="city"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">All Cities</option>
                  {cities.map((city, index) => (
                    <option key={index} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                >
                  <option value="">All Categories</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={resetFilters}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
              >
                Reset Filters
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            </div>
          ) : error ? (
            <div className="p-6 text-red-500">{error}</div>
          ) : (
            <>
              <div className="h-[600px]">
                <GoogleMap
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                  center={userLocation}
                  zoom={12}
                  markers={mapMarkers}
                  onDragEnd={handleMapDragEnd}
                  showSearchBox={true}
                  onPlaceSelected={handlePlaceSelected}
                  height="600px"
                />
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <h2 className="text-xl font-bold mb-4">Found {exhibitions.length} Exhibitions</h2>
                
                {exhibitions.length === 0 ? (
                  <p className="text-gray-500">No exhibitions found in this area. Try adjusting your filters or location.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {exhibitions.map((exhibition) => (
                      <div key={exhibition._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <h3 className="font-bold text-lg text-gray-800 mb-1">
                          {exhibition.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          {exhibition.location.name}, {exhibition.location.city}
                        </p>
                        {exhibition.closedDay && (
                          <p className="text-amber-600 text-sm mb-2">
                            Closed on {exhibition.closedDay}s
                          </p>
                        )}
                        <p className="text-gray-500 text-sm">
                          {new Date(exhibition.startDate).toLocaleDateString()} - {new Date(exhibition.endDate).toLocaleDateString()}
                        </p>
                        <div className="mt-3 flex space-x-2">
                          {exhibition.category.slice(0, 3).map((cat, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                              {cat}
                            </span>
                          ))}
                        </div>
                        <a 
                          href={`/exhibition/${exhibition._id}`}
                          className="block mt-3 text-center bg-rose-500 text-white px-3 py-1 rounded text-sm hover:bg-rose-600 transition-colors"
                        >
                          View Details
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
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