'use client';

import { useState, useEffect } from 'react';
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
  tags: string[];
}

export default function ExhibitionsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get search params from URL
  const initialSearchText = searchParams.get('search') || '';
  const initialCity = searchParams.get('city') || '';
  const initialCountry = searchParams.get('country') || '';
  const initialCategory = searchParams.get('category') || '';
  const initialArtist = searchParams.get('artist') || '';
  const initialTag = searchParams.get('tag') || '';
  const initialSort = searchParams.get('sort') || '-popularity';
  
  // State for filters
  const [searchText, setSearchText] = useState(initialSearchText);
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedArtist, setSelectedArtist] = useState(initialArtist);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [sortOption, setSortOption] = useState(initialSort);
  
  // State for data
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalExhibitions, setTotalExhibitions] = useState(0);
  
  // Filter options
  const [cities, setCities] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  
  // Show more/less filters
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Fetch exhibitions
  useEffect(() => {
    fetchExhibitions();
  }, [currentPage, sortOption]);
  
  const fetchExhibitions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      // Pagination
      params.append('limit', itemsPerPage.toString());
      params.append('skip', ((currentPage - 1) * itemsPerPage).toString());
      
      // Sort
      params.append('sort', sortOption);
      
      // Apply filters
      if (searchText) params.append('search', searchText);
      if (selectedCity) params.append('city', selectedCity);
      if (selectedCountry) params.append('country', selectedCountry);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedArtist) params.append('artist', selectedArtist);
      if (selectedTag) params.append('tag', selectedTag);
      
      const response = await fetch(`/api/exhibitions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setExhibitions(data.data);
        setTotalExhibitions(data.meta.total || 0);
        
        // Update filter options
        if (data.meta && data.meta.filter_options) {
          setCities(data.meta.filter_options.cities || []);
          setCountries(data.meta.filter_options.countries || []);
          setCategories(data.meta.filter_options.categories || []);
          
          // In a real app, these would come from the API
          // For now, we'll leave them empty or add some placeholder values
          setArtists(data.meta.filter_options.artists || []);
          setTags(data.meta.filter_options.tags || []);
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
  
  // Handle filter changes
  const handleFilterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    filterType: string
  ) => {
    const { value } = e.target;
    
    // Reset to page 1 when filter changes
    setCurrentPage(1);
    
    switch (filterType) {
      case 'search':
        setSearchText(value);
        break;
      case 'city':
        setSelectedCity(value);
        break;
      case 'country':
        setSelectedCountry(value);
        break;
      case 'category':
        setSelectedCategory(value);
        break;
      case 'artist':
        setSelectedArtist(value);
        break;
      case 'tag':
        setSelectedTag(value);
        break;
      case 'sort':
        setSortOption(value);
        break;
      default:
        break;
    }
  };
  
  // Apply filters
  const applyFilters = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // Update URL with current filters
    const params = new URLSearchParams();
    if (searchText) params.set('search', searchText);
    if (selectedCity) params.set('city', selectedCity);
    if (selectedCountry) params.set('country', selectedCountry);
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedArtist) params.set('artist', selectedArtist);
    if (selectedTag) params.set('tag', selectedTag);
    if (sortOption !== '-popularity') params.set('sort', sortOption);
    
    // Update URL without refreshing the page
    router.push(`/exhibitions?${params.toString()}`);
    
    // Fetch exhibitions with new filters
    fetchExhibitions();
  };
  
  // Clear all filters
  const clearFilters = () => {
    setSearchText('');
    setSelectedCity('');
    setSelectedCountry('');
    setSelectedCategory('');
    setSelectedArtist('');
    setSelectedTag('');
    setSortOption('-popularity');
    setCurrentPage(1);
    
    router.push('/exhibitions');
    
    // Fetch exhibitions with cleared filters
    fetchExhibitions();
  };
  
  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };
  
  // Calculate total pages
  const totalPages = Math.ceil(totalExhibitions / itemsPerPage);
  
  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    
    // Calculate range of pages to show
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = startPage + maxPagesToShow - 1;
    
    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    // Previous button
    items.push(
      <button
        key="prev"
        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 border rounded-md mr-2 disabled:opacity-50"
        aria-label="Previous page"
      >
        &laquo;
      </button>
    );
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1 border rounded-md mr-2 ${
            currentPage === i ? 'bg-rose-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Next button
    items.push(
      <button
        key="next"
        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border rounded-md disabled:opacity-50"
        aria-label="Next page"
      >
        &raquo;
      </button>
    );
    
    return items;
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Exhibitions</h1>
          
          <div>
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="text-rose-500 hover:text-rose-600"
            >
              {showMoreFilters ? 'Less Filters' : 'More Filters'} 
              <span className="ml-1">{showMoreFilters ? '△' : '▽'}</span>
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={applyFilters} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Search */}
              <div className="col-span-1 md:col-span-3">
                <div className="relative">
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => handleFilterChange(e, 'search')}
                    placeholder="Search exhibitions, artists, venues..."
                    className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Basic filters always shown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select
                  value={selectedCity}
                  onChange={(e) => handleFilterChange(e, 'city')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">All Cities</option>
                  {cities.map((city, index) => (
                    <option key={index} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleFilterChange(e, 'category')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category, index) => (
                    <option key={index} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => handleFilterChange(e, 'sort')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="-popularity">Most Popular</option>
                  <option value="startDate">Start Date (Earliest First)</option>
                  <option value="-startDate">Start Date (Latest First)</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="-title">Title (Z-A)</option>
                </select>
              </div>
              
              {/* Advanced filters (hidden by default) */}
              {showMoreFilters && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      value={selectedCountry}
                      onChange={(e) => handleFilterChange(e, 'country')}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">All Countries</option>
                      {countries.map((country, index) => (
                        <option key={index} value={country}>{country}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
                    <select
                      value={selectedArtist}
                      onChange={(e) => handleFilterChange(e, 'artist')}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">All Artists</option>
                      {artists.map((artist, index) => (
                        <option key={index} value={artist}>{artist}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <select
                      value={selectedTag}
                      onChange={(e) => handleFilterChange(e, 'tag')}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">All Tags</option>
                      {tags.map((tag, index) => (
                        <option key={index} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Clear Filters
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-rose-500 rounded-lg hover:bg-rose-600"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>
        
        {/* Results */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
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
              Try adjusting your search criteria or explore our featured exhibitions.
            </p>
            <button
              onClick={clearFilters}
              className="inline-block bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600 transition-colors"
            >
              View All Exhibitions
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 text-gray-600">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalExhibitions)} of {totalExhibitions} exhibitions
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8">
                {getPaginationItems()}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}