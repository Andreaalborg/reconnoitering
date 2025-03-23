'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ExhibitionCard from '@/components/ExhibitionCard';
import Link from 'next/link';
import Image from 'next/image';

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
  category: string[];
  artists: string[];
  ticketPrice: string;
  ticketUrl: string;
}

export default function DateSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get date from URL or use today
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  const dateParam = searchParams.get('date') || formattedToday;
  
  const [searchDate, setSearchDate] = useState<string>(dateParam);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('city') || '');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  
  // For day planning
  const [selectedExhibitions, setSelectedExhibitions] = useState<string[]>([]);
  
  useEffect(() => {
    fetchExhibitions();
  }, [searchDate, selectedCity, selectedCategory]);
  
  const fetchExhibitions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build URL with search parameters
      const params = new URLSearchParams();
      params.append('date', searchDate);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await fetch(`/api/exhibitions/date?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setExhibitions(data.data);
        
        // Extract unique cities and categories for filters
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
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    if (searchDate) params.set('date', searchDate);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedCategory) params.set('category', selectedCategory);
    
    router.push(`/date-search?${params.toString()}`);
    
    fetchExhibitions();
  };
  
  const handleExhibitionSelection = (exhibitionId: string) => {
    setSelectedExhibitions(prev => {
      // Check if already selected
      if (prev.includes(exhibitionId)) {
        // Remove from selection
        return prev.filter(id => id !== exhibitionId);
      } else {
        // Add to selection
        return [...prev, exhibitionId];
      }
    });
  };
  
  const startPlanningDay = () => {
    // Create a URL parameter with selected exhibition IDs
    router.push(`/day-planner?date=${searchDate}&exhibitions=${selectedExhibitions.join(',')}`);
  };
  
  // Format a date for display
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Exhibitions by Date</h1>
          
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                id="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <select
                id="city"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Cities</option>
                {cities.map((city, index) => (
                  <option key={index} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">All Categories</option>
                {categories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-4 rounded transition-colors w-full"
              >
                Search
              </button>
            </div>
          </form>
        </div>
        
        {searchDate && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Exhibitions on {formatDateForDisplay(searchDate)}
              {selectedCity && ` in ${selectedCity}`}
              {selectedCategory && `, ${selectedCategory} category`}
            </h2>
          </div>
        )}
        
        {/* Display selection bar when exhibitions are selected */}
        {selectedExhibitions.length > 0 && (
          <div className="sticky top-20 z-10 bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-md">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="mb-3 md:mb-0">
                <span className="font-medium text-blue-700">
                  {selectedExhibitions.length} exhibition{selectedExhibitions.length !== 1 ? 's' : ''} selected
                </span>
                <p className="text-sm text-blue-600">Create a day plan with these exhibitions</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setSelectedExhibitions([])}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                >
                  Clear Selection
                </button>
                <button
                  onClick={startPlanningDay}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Plan My Day
                </button>
              </div>
            </div>
          </div>
        )}
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        ) : exhibitions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No exhibitions found</h3>
            <p className="text-gray-600 mb-6">
              There are no exhibitions available on this date with your selected criteria.
            </p>
            <Link
              href="/exhibitions"
              className="inline-block bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600 transition-colors"
            >
              Browse All Exhibitions
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {exhibitions.map((exhibition) => (
              <div key={exhibition._id} className="relative">
                {/* Tydeligere select-knapp plassert utenfor ExhibitionCard */}
                <div className="absolute top-3 right-3 z-20">
                  <button
                    type="button"
                    onClick={() => handleExhibitionSelection(exhibition._id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-colors ${
                      selectedExhibitions.includes(exhibition._id)
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white text-gray-500 hover:bg-gray-100'
                    }`}
                    title={selectedExhibitions.includes(exhibition._id) 
                      ? "Remove from plan" 
                      : "Add to day plan"
                    }
                  >
                    {selectedExhibitions.includes(exhibition._id) ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    )}
                  </button>
                </div>
                
                <ExhibitionCard
                  id={exhibition._id}
                  title={exhibition.title}
                  location={exhibition.location}
                  coverImage={exhibition.coverImage}
                  startDate={exhibition.startDate}
                  endDate={exhibition.endDate}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}