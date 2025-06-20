// src/app/venues/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// Icons as inline SVG
const MapPinIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const GlobeAltIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
  </svg>
);

const BuildingOfficeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

interface Venue {
  _id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  defaultClosedDays?: string[];
  currentExhibitions?: Array<{
    _id: string;
    title: string;
  }>;
  exhibitionCount?: number;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [filteredVenues, setFilteredVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [showOnlyWithExhibitions, setShowOnlyWithExhibitions] = useState(false);
  
  // Filter options
  const [countries, setCountries] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  // Helper function to check if venue is closed today
  const isClosedToday = (closedDays: string[] = []): boolean => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const today = days[new Date().getDay()];
    return closedDays.includes(today);
  };

  const fetchVenues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/venues?includeDetails=true');
      
      if (!response.ok) {
        throw new Error('Failed to fetch venues');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setVenues(data.data || []);
        setFilteredVenues(data.data || []);
        
        // Extract unique countries and cities
        const uniqueCountries = [...new Set(data.data.map((v: Venue) => v.country))].sort();
        const uniqueCities = [...new Set(data.data.map((v: Venue) => v.city))].sort();
        
        setCountries(uniqueCountries);
        setCities(uniqueCities);
      } else {
        throw new Error(data.error || 'Failed to fetch venues');
      }
    } catch (err: any) {
      console.error('Error fetching venues:', err);
      setError(err.message || 'Failed to load venues');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVenues();
  }, [fetchVenues]);

  // Filter venues based on criteria
  useEffect(() => {
    let filtered = venues;

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(venue =>
        venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        venue.country.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Country filter
    if (selectedCountry) {
      filtered = filtered.filter(venue => venue.country === selectedCountry);
    }

    // City filter
    if (selectedCity) {
      filtered = filtered.filter(venue => venue.city === selectedCity);
    }

    // Exhibition filter
    if (showOnlyWithExhibitions) {
      filtered = filtered.filter(venue => venue.exhibitionCount && venue.exhibitionCount > 0);
    }

    setFilteredVenues(filtered);
  }, [venues, searchQuery, selectedCountry, selectedCity, showOnlyWithExhibitions]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <main className="container-wide py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-serif mb-4">Art Venues</h1>
        <p className="text-gray-600">Discover galleries, museums, and exhibition spaces around the world</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="lg:col-span-2">
            <input
              type="text"
              placeholder="Search venues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Country filter */}
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>

          {/* City filter */}
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="">All Cities</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Exhibition filter */}
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyWithExhibitions}
              onChange={(e) => setShowOnlyWithExhibitions(e.target.checked)}
              className="w-4 h-4 text-rose-500 rounded focus:ring-rose-500"
            />
            <span className="text-sm">With exhibitions only</span>
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {filteredVenues.length} of {venues.length} venues
          </p>
          {(searchQuery || selectedCountry || selectedCity || showOnlyWithExhibitions) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('');
                setSelectedCity('');
                setShowOnlyWithExhibitions(false);
              }}
              className="text-sm text-rose-500 hover:text-rose-600"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Venues Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredVenues.map(venue => {
          const isClosed = isClosedToday(venue.defaultClosedDays);
          
          return (
            <Link
              key={venue._id}
              href={`/venues/${venue._id}`}
              className="card-minimal hover-lift relative overflow-hidden"
            >
              {isClosed && (
                <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  CLOSED TODAY
                </div>
              )}
              
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-1">{venue.name}</h3>
                  <p className="text-gray-600 flex items-center gap-1">
                    <MapPinIcon className="w-4 h-4" />
                    {venue.city}, {venue.country}
                  </p>
                </div>
                {venue.exhibitionCount !== undefined && venue.exhibitionCount > 0 && (
                  <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-sm font-medium">
                    {venue.exhibitionCount} exhibition{venue.exhibitionCount > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {venue.address && (
                <p className="text-sm text-gray-500 mb-3 flex items-start gap-1">
                  <BuildingOfficeIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {venue.address}
                </p>
              )}

              {venue.currentExhibitions && venue.currentExhibitions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-700 mb-2">Current exhibitions:</p>
                  <ul className="space-y-1">
                    {venue.currentExhibitions.slice(0, 2).map(exhibition => (
                      <li key={exhibition._id} className="text-sm text-gray-600 truncate">
                        • {exhibition.title}
                      </li>
                    ))}
                    {venue.currentExhibitions.length > 2 && (
                      <li className="text-sm text-gray-500 italic">
                        +{venue.currentExhibitions.length - 2} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {venue.defaultClosedDays && venue.defaultClosedDays.length > 0 && (
                <div className="mt-3 text-xs text-gray-500">
                  Closed: {venue.defaultClosedDays.join(', ')}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      {filteredVenues.length === 0 && (
        <div className="text-center py-12">
          <GlobeAltIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No venues found matching your criteria</p>
        </div>
      )}
    </main>
  );
}