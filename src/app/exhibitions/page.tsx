'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ExhibitionCard from '@/components/ExhibitionCard';

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
  };
  category: string[];
  artists: string[];
  popularity: number;
}

export default function ExhibitionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [location, setLocation] = useState(searchParams.get('city') || '');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  
  // Unique values for filter options
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  
  // Fetch exhibitions
  useEffect(() => {
    const fetchExhibitions = async () => {
      setLoading(true);
      try {
        let url = '/api/exhibitions';
        const params = new URLSearchParams();
        
        if (location) params.append('city', location);
        if (category) params.append('category', category);
        
        if (dateFilter === 'upcoming') {
          const today = new Date().toISOString();
          params.append('startDate', today);
        } else if (dateFilter === 'this-month') {
          const today = new Date();
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString();
          params.append('startDate', today.toISOString());
          params.append('endDate', endOfMonth);
        } else if (dateFilter === 'next-month') {
          const today = new Date();
          const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1).toISOString();
          const endOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString();
          params.append('startDate', startOfNextMonth);
          params.append('endDate', endOfNextMonth);
        }
        
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch exhibitions');
        }
        
        const data = await response.json();
        setExhibitions(data.data);
        
        // Extract unique cities and categories for filters
        const uniqueCities = Array.from(new Set(data.data.map((ex: Exhibition) => ex.location.city)));
        const uniqueCategories = Array.from(
          new Set(data.data.flatMap((ex: Exhibition) => ex.category))
        );
        
        setCities(uniqueCities as string[]);
        setCategories(uniqueCategories as string[]);
      } catch (err) {
        console.error('Error fetching exhibitions:', err);
        setError('Failed to load exhibitions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExhibitions();
  }, [location, dateFilter, category]);
  
  // Apply filters
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (location) params.append('city', location);
    if (dateFilter) params.append('date', dateFilter);
    if (category) params.append('category', category);
    
    router.push(`/exhibitions${params.toString() ? `?${params.toString()}` : ''}`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Exhibitions</h1>
        </div>
        
        <div className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Filter Exhibitions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <select 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">All Locations</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <select 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="">Any Date</option>
                <option value="upcoming">Upcoming</option>
                <option value="this-month">This Month</option>
                <option value="next-month">Next Month</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-rose-500 focus:ring-rose-500"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded"
                onClick={applyFilters}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-md">
            {error}
          </div>
        ) : exhibitions.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold mb-2">No exhibitions found</h2>
            <p className="text-gray-500">Try adjusting your filters to see more results.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {exhibitions.map((exhibition) => (
              <ExhibitionCard
                key={exhibition._id}
                id={exhibition._id}
                title={exhibition.title}
                location={exhibition.location}
                coverImage={exhibition.coverImage}
                startDate={exhibition.startDate}
                endDate={exhibition.endDate}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}