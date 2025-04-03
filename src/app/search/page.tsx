'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
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
  };
  category: string[];
  artists: string[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get search term from URL
  const searchQuery = searchParams.get('q') || '';
  
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  
  useEffect(() => {
    // This ensures the code only runs in the browser
    if (searchQuery && typeof window !== 'undefined') {
      fetchSearchResults(searchQuery);
    } else {
      setLoading(false);
    }
  }, [searchQuery]);  
  
  const fetchSearchResults = async (query: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Use URL constructor only in browser context
      if (typeof window === 'undefined') return;
      
      const response = await fetch(`/api/exhibitions?search=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setExhibitions(data.data || []);
    } catch (err: any) {
      console.error('Error searching exhibitions:', err);
      setError(err.message || 'Failed to search exhibitions');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Search Exhibitions</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search exhibitions, artists, venues..."
              className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button 
              type="submit"
              className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Search
            </button>
          </form>
        </div>
        
        {searchQuery && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Search results for "{searchQuery}"
            </h2>
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
        ) : searchQuery && exhibitions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">No results found</h3>
            <p className="text-gray-600 mb-6">
              We couldn't find any exhibitions matching your search term. Try different keywords or browse all exhibitions.
            </p>
            <Link
              href="/exhibitions"
              className="inline-block bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600 transition-colors"
            >
              Browse All Exhibitions
            </Link>
          </div>
        ) : exhibitions.length > 0 ? (
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
        ) : !searchQuery ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h3 className="text-xl font-semibold mb-2">Enter a search term</h3>
            <p className="text-gray-600">
              Search for exhibitions by title, artist, location, and more.
            </p>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}