// src/app/map/page.tsx
'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import EnhancedGoogleMap from '@/components/EnhancedGoogleMap';

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
  address?: string;
  websiteUrl?: string;
  defaultClosedDays?: string[];
  currentExhibitions?: Array<{
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    imageUrl?: string;
  }>;
  exhibitionCount?: number;
}

function MapPageContent() {
  const router = useRouter();
  
  // Default center (Oslo)
  const DEFAULT_CENTER = { lat: 59.9139, lng: 10.7522 };
  
  const [venues, setVenues] = useState<MapVenue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<MapVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [initialCenterSet, setInitialCenterSet] = useState(false);
  
  // Location selection mode
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [searchRadius, setSearchRadius] = useState(5); // Default 5km radius
  const [showRadiusFilter, setShowRadiusFilter] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
          console.log("Geolocation success:", userCoords);
          setMapCenter(userCoords);
          setUserPosition(userCoords);
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
      const response = await fetch(`/api/venues?includeDetails=true`);
      
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
      setSearchedLocation(newCenter);
    }
  }, []);
  
  const handleMapDragEnd = useCallback((center: { lat: number; lng: number }) => {
  }, []);
  
  const handleMarkerClick = useCallback((venueId: string) => {
    router.push(`/venues/${venueId}`);
  }, [router]);
  
  // Haversine formula to calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Filter venues based on radius
  useEffect(() => {
    if (!showRadiusFilter || !selectedLocation) {
      setFilteredVenues(venues);
      return;
    }
    
    const filtered = venues.filter(venue => {
      const distance = calculateDistance(
        selectedLocation.lat,
        selectedLocation.lng,
        venue.coordinates.lat,
        venue.coordinates.lng
      );
      return distance <= searchRadius;
    });
    
    setFilteredVenues(filtered);
  }, [venues, selectedLocation, searchRadius, showRadiusFilter]);

  // Calculate total exhibitions in filtered venues
  const totalExhibitions = filteredVenues.reduce((total, venue) => {
    return total + (venue.exhibitionCount || 0);
  }, 0);
  

  const mapMarkers = filteredVenues.map(venue => ({
    id: venue._id,
    position: venue.coordinates,
    title: venue.name,
    address: venue.address,
    city: venue.city,
    country: venue.country,
    websiteUrl: venue.websiteUrl,
    defaultClosedDays: venue.defaultClosedDays,
    currentExhibitions: venue.currentExhibitions,
    exhibitionCount: venue.exhibitionCount,
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
      <main className="container-wide py-6 sm:py-8">
        <div className="flex flex-col gap-4 mb-4 sm:mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl sm:text-3xl font-serif text-[var(--primary)]">Venue Map</h1>
          </div>
          
          {/* Location Selection Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowRadiusFilter(false);
                  setSelectedLocation(null);
                  setFilteredVenues(venues);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  !showRadiusFilter 
                    ? 'bg-rose-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Venues
              </button>
              <button
                onClick={() => {
                  if (userPosition) {
                    setSelectedLocation(userPosition);
                    setShowRadiusFilter(true);
                  }
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  showRadiusFilter && selectedLocation?.lat === userPosition?.lat
                    ? 'bg-rose-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={!userPosition}
              >
                Near Me
              </button>
              {searchedLocation && (
                <button
                  onClick={() => {
                    setSelectedLocation(searchedLocation);
                    setShowRadiusFilter(true);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    showRadiusFilter && selectedLocation?.lat === searchedLocation?.lat
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Near Search
                </button>
              )}
            </div>
            
            {/* Radius Slider */}
            {showRadiusFilter && (
              <div className="flex items-center gap-3 bg-white rounded-lg px-4 py-2 shadow-sm">
                <span className="text-sm font-medium text-gray-700">Radius:</span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={searchRadius}
                  onChange={(e) => setSearchRadius(parseInt(e.target.value))}
                  className="w-32"
                />
                <span className="text-sm font-medium text-gray-900 min-w-[3rem]">{searchRadius} km</span>
              </div>
            )}
            
            {/* Results count */}
            {showRadiusFilter && (
              <div className="text-sm text-gray-600 space-y-1">
                <div>Found {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''} within {searchRadius} km radius</div>
                <div className="text-rose-600 font-medium">{totalExhibitions} exhibition{totalExhibitions !== 1 ? 's' : ''} available</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="card-minimal overflow-hidden">
          {loading && !venues.length ? (
            <div className="flex justify-center items-center h-[50vh] sm:h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--secondary)]"></div>
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6 text-red-500">{error}</div>
          ) : (
            <div className="relative">
              <div className="h-[calc(100vh-200px)] sm:h-[500px] md:h-[600px] lg:h-[700px]">
                <EnhancedGoogleMap
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                  center={mapCenter}
                  zoom={12}
                  markers={mapMarkers}
                  userPosition={userPosition}
                  selectedLocation={selectedLocation}
                  searchedLocation={searchedLocation}
                  showRadius={showRadiusFilter}
                  radiusKm={searchRadius}
                  showSearchBox={true}
                  onPlaceSelected={handlePlaceSelected}
                  onMarkerClick={handleMarkerClick}
                  height="100%"
                />
              </div>
              <div className="absolute bottom-4 left-4 right-4 sm:hidden">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 text-sm">
                  <p className="text-[var(--text-muted)]">Tap markers to view venues</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Mobile info */}
        <div className="mt-4 sm:hidden">
          <div className="bg-[var(--primary-light)] rounded-lg p-4">
            <h2 className="font-semibold mb-2">Tips for mobile:</h2>
            <ul className="text-sm text-[var(--text-muted)] space-y-1">
              <li>• Pinch to zoom in/out</li>
              <li>• Tap venue markers for details</li>
              <li>• Use search to find locations</li>
            </ul>
          </div>
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