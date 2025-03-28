// src/app/date-search/page.tsx - Fixed version
'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  category: string[];
  artists: string[];
  ticketPrice?: string;
  ticketUrl?: string;
  closedDay?: string; // Added for weekly closing day
}

function DateSearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get dates from URL or use current dates
  const today = new Date();
  const formattedToday = today.toISOString().split('T')[0];
  
  // Default end date is 7 days from today
  const defaultEndDate = new Date();
  defaultEndDate.setDate(today.getDate() + 7);
  const formattedDefaultEnd = defaultEndDate.toISOString().split('T')[0];
  
  // Initialize states with defaults - we'll update from URL params in useEffect
  const [startDate, setStartDate] = useState<string>(formattedToday);
  const [endDate, setEndDate] = useState<string>(formattedDefaultEnd);
  const [useDateRange, setUseDateRange] = useState<boolean>(false);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // For day planning
  const [selectedExhibitions, setSelectedExhibitions] = useState<string[]>([]);

  // Safely get URL parameters after component mounts
  useEffect(() => {
    if (searchParams) {
      // Use URL params or defaults
      const startDateParam = searchParams.get('startDate');
      if (startDateParam) setStartDate(startDateParam);
      
      const endDateParam = searchParams.get('endDate');
      if (endDateParam) {
        setEndDate(endDateParam);
        setUseDateRange(true);
      }
      
      const cityParam = searchParams.get('city');
      if (cityParam) setSelectedCity(cityParam);
      
      const categoryParam = searchParams.get('category');
      if (categoryParam) setSelectedCategory(categoryParam);
    }
    
    fetchExhibitions();
  }, [searchParams]);
  
  const fetchExhibitions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Safely build search parameters
      const params = new URLSearchParams();
      
      // Only access search params after being sure we're on the client
      if (typeof window !== 'undefined') {
        if (searchParams) {
          // Use date parameters from URL if available
          const urlStartDate = searchParams.get('startDate');
          const urlEndDate = searchParams.get('endDate');
          const urlCity = searchParams.get('city');
          const urlCategory = searchParams.get('category');
          
          if (urlStartDate) params.append(urlEndDate ? 'startDate' : 'date', urlStartDate);
          if (urlEndDate) params.append('endDate', urlEndDate);
          if (urlCity) params.append('city', urlCity);
          if (urlCategory) params.append('category', urlCategory);
        } else {
          // Use state values as fallback
          if (useDateRange) {
            params.append('startDate', startDate);
            params.append('endDate', endDate);
          } else {
            params.append('date', startDate);
          }
          
          if (selectedCity) params.append('city', selectedCity);
          if (selectedCategory) params.append('category', selectedCategory);
        }
      
        // Choose appropriate API endpoint based on whether using date range or single date
        const endpoint = params.has('endDate') ? '/api/exhibitions' : '/api/exhibitions/date';
        const response = await fetch(`${endpoint}?${params.toString()}`);
        
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
    
    if (useDateRange) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    } else {
      params.set('startDate', startDate);
    }
    
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
    const planStartDate = useDateRange ? startDate : startDate;
    router.push(`/day-planner?date=${planStartDate}&exhibitions=${selectedExhibitions.join(',')}`);
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
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Find Exhibitions by Date</h1>
          
          <form onSubmit={handleSearchSubmit} className="space-y-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="useDateRange"
                checked={useDateRange}
                onChange={(e) => setUseDateRange(e.target.checked)}
                className="mr-2 h-4 w-4 text-rose-500"
              />
              <label htmlFor="useDateRange" className="text-gray-700">
                Search by date range
              </label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {useDateRange ? (
                <>
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}
              
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
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
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
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
            </div>
            
            <div className="flex justify-end">
              <button 
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-6 rounded transition-colors"
              >
                Search
              </button>
            </div>
          </form>
        </div>
        
        {(startDate || endDate) && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              {useDateRange 
                ? `Exhibitions from ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`
                : `Exhibitions on ${formatDateForDisplay(startDate)}`}
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
                {/* Selection button */}
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
                
                {/* Closed day badge if provided */}
                {exhibition.closedDay && (
                  <div className="absolute bottom-3 left-3 bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                    Closed on {exhibition.closedDay}s
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

export default function DateSearchPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
        <DateSearchContent />
      </Suspense>
    </div>
  );
}