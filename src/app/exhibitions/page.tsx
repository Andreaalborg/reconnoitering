'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ExhibitionCard from '@/components/ExhibitionCard';
import Select from 'react-select';

// Reuse or define the European countries list
const EUROPEAN_COUNTRIES = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", 
  "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", 
  "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", 
  "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", 
  "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", 
  "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", 
  "Turkey", "Ukraine", "United Kingdom", "UK", "Vatican City"
].sort(); // Sort alphabetically for display

interface Exhibition {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  venue?: any;
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

interface SelectOption {
  value: string;
  label: string;
}

// --- Format options for react-select --- 
const europeanCountryOptions: SelectOption[] = EUROPEAN_COUNTRIES.map(country => ({
  value: country,
  label: country
}));

function ExhibitionsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // --- Initial filter values --- 
  const initialSearchText = searchParams.get('q') || '';
  const initialCityValues = (searchParams.get('cities') || '').split(',').filter(Boolean);
  const initialCountryValues = (searchParams.get('countries') || '').split(',').filter(Boolean);
  const initialCategory = searchParams.get('category') || '';
  const initialArtist = searchParams.get('artist') || '';
  const initialTag = searchParams.get('tag') || '';
  const initialSort = searchParams.get('sort') || '-popularity';
  
  // --- State for filters --- 
  const [searchText, setSearchText] = useState(initialSearchText);
  const [selectedCities, setSelectedCities] = useState<SelectOption[]>([]); // Now array of SelectOption
  const [selectedCountries, setSelectedCountries] = useState<SelectOption[]>([]); // Now array of SelectOption
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedArtist, setSelectedArtist] = useState(initialArtist);
  const [selectedTag, setSelectedTag] = useState(initialTag);
  const [sortOption, setSortOption] = useState(initialSort);
  
  // --- State for data & options --- 
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalExhibitions, setTotalExhibitions] = useState(0);
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]); // Options for City dropdown
  const [categories, setCategories] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  
  // --- Pagination State --- 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // --- Initialize state from URL --- 
  useEffect(() => {
      // Find matching options based on initial values from URL
      const initialCountryObjects = europeanCountryOptions.filter(opt => initialCountryValues.includes(opt.value));
      setSelectedCountries(initialCountryObjects);
      // City options need to be fetched first, selection happens in fetchExhibitions
  }, []); // Run only once on mount

  // --- Fetch exhibitions and filter options --- 
  useEffect(() => {
    // Fetch based on current state
    fetchExhibitions(); 
  }, [currentPage, sortOption, selectedCountries, selectedCategory, selectedArtist, selectedTag]); // Re-fetch when these filters change

  const fetchExhibitions = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      // --- Add current filter states to params --- 
      params.append('limit', itemsPerPage.toString());
      params.append('skip', ((currentPage - 1) * itemsPerPage).toString());
      params.append('sort', sortOption);
      if (searchText) params.append('q', searchText);
      // Send selected city values
      if (selectedCities.length > 0) params.append('cities', selectedCities.map(c => c.value).join(','));
      // Send selected country values
      if (selectedCountries.length > 0) params.append('countries', selectedCountries.map(c => c.value).join(',')); 
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedArtist) params.append('artist', selectedArtist);
      if (selectedTag) params.append('tag', selectedTag);
      
      const response = await fetch(`/api/exhibitions?${params.toString()}`);
      if (!response.ok) { throw new Error('Failed to fetch exhibitions'); }
      const data = await response.json();
      
      if (data.success) {
        setExhibitions(data.data);
        setTotalExhibitions(data.meta.total || 0);
        
        if (data.meta?.filter_options) {
            // Update City options based on API response (filtered by country etc.)
            const fetchedCityOptions = (data.meta.filter_options.cities || []).map((city: string) => ({ value: city, label: city }));
            setCityOptions(fetchedCityOptions);
            
            // Re-apply initial city selection if applicable, now that options are loaded
            const initialCityValuesFromUrl = (searchParams.get('cities') || '').split(',').filter(Boolean);
            setSelectedCities(fetchedCityOptions.filter((opt: SelectOption) => initialCityValuesFromUrl.includes(opt.value)));
            
            // Update other dynamic filters
            setCategories(data.meta.filter_options.categories || []);
            setArtists(data.meta.filter_options.artists || []);
            setTags(data.meta.filter_options.tags || []);
        }
      } else { throw new Error(data.error || 'API error'); }
    } catch (err: any) {
      console.error('Error fetching exhibitions:', err);
      setError(err.message || 'Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };
  
  // --- Handlers --- 
  
  // Handle search text input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchText(e.target.value);
      // Optionally trigger fetch immediately or wait for Apply Filters
  };

  // Handle simple select changes (Category, Artist, Tag, Sort)
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, filterType: string) => {
      setCurrentPage(1);
      const { value } = e.target;
      switch (filterType) {
          case 'category': setSelectedCategory(value); break;
          case 'artist': setSelectedArtist(value); break;
          case 'tag': setSelectedTag(value); break;
          case 'sort': setSortOption(value); break; // Fetch is triggered by useEffect
      }
  };

  // Handle Multi-Select changes (Country, City)
  const handleMultiSelectChange = (selectedOptions: readonly SelectOption[] | null, filterType: 'country' | 'city') => {
      setCurrentPage(1);
      const optionsArray = selectedOptions ? Array.from(selectedOptions) : [];
      if (filterType === 'country') {
          setSelectedCountries(optionsArray);
          // When country changes, we might want to clear city selection and fetch new city options
          setSelectedCities([]); 
          // Fetching happens via useEffect dependency on selectedCountries
      } else if (filterType === 'city') {
          setSelectedCities(optionsArray);
          // No need to fetch again here, wait for Apply Filters button
      }
  };

  // Apply filters (called by form submit)
  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (searchText) params.set('q', searchText);
    if (selectedCities.length > 0) params.set('cities', selectedCities.map(c => c.value).join(','));
    if (selectedCountries.length > 0) params.set('countries', selectedCountries.map(c => c.value).join(','));
    if (selectedCategory) params.set('category', selectedCategory);
    if (selectedArtist) params.set('artist', selectedArtist);
    if (selectedTag) params.set('tag', selectedTag);
    if (sortOption !== '-popularity') params.set('sort', sortOption);
    router.push(`/exhibitions?${params.toString()}`);
    fetchExhibitions(); // Fetch with new filters
  };
  
  // Clear all filters
  const clearFilters = () => {
    setCurrentPage(1);
    setSearchText('');
    setSelectedCities([]);
    setSelectedCountries([]);
    setSelectedCategory('');
    setSelectedArtist('');
    setSelectedTag('');
    setSortOption('-popularity');
    router.push('/exhibitions');
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
    <>
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Exhibitions in Europe</h1>
        
        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <form onSubmit={applyFilters} className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
               <input
                 type="text"
                 value={searchText}
                 onChange={handleSearchChange}
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

            {/* Filter Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              
              {/* Country Filter (Multi-Select Dropdown) */}
              <div>
                <label htmlFor="countries-select" className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <Select<SelectOption, true>
                  id="countries-select"
                  instanceId="countries-select-instance"
                  isMulti
                  options={europeanCountryOptions}
                  value={selectedCountries}
                  onChange={(options) => handleMultiSelectChange(options, 'country')}
                  placeholder="Select countries..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  closeMenuOnSelect={false}
                />
              </div>
              
              {/* City Filter (Multi-Select Dropdown - Dynamic Options) */}
              <div>
                <label htmlFor="cities-select" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <Select<SelectOption, true>
                  id="cities-select"
                  instanceId="cities-select-instance"
                  isMulti
                  options={cityOptions}
                  value={selectedCities}
                  onChange={(options) => handleMultiSelectChange(options, 'city')}
                  placeholder="Select cities..."
                  noOptionsMessage={() => selectedCountries.length === 0 ? 'Select a country first' : 'No cities found'}
                  isDisabled={loading}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  closeMenuOnSelect={false}
                />
              </div>
              
              {/* Category Filter (Select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleSelectChange(e, 'category')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat, i) => <option key={i} value={cat}>{cat}</option>)} 
                </select>
              </div>
              
              {/* Artist Filter (Select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Artist</label>
                 <select
                  value={selectedArtist}
                  onChange={(e) => handleSelectChange(e, 'artist')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">All Artists</option>
                  {artists.map((a, i) => <option key={i} value={a}>{a}</option>)} 
                </select>
              </div>

              {/* Tag Filter (Select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tag</label>
                 <select
                  value={selectedTag}
                  onChange={(e) => handleSelectChange(e, 'tag')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">All Tags</option>
                  {tags.map((t, i) => <option key={i} value={t}>{t}</option>)} 
                </select>
              </div>

               {/* Sort By Filter (Select) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select
                  value={sortOption}
                  onChange={(e) => handleSelectChange(e, 'sort')}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="-popularity">Most Popular</option>
                  <option value="startDate">Start Date (Earliest First)</option>
                  <option value="-startDate">Start Date (Latest First)</option>
                  <option value="title">Title (A-Z)</option>
                  <option value="-title">Title (Z-A)</option>
                </select>
              </div>

            </div>

            {/* Buttons */} 
            <div className="flex justify-end space-x-3">
                <button 
                    type="button" 
                    onClick={clearFilters}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Clear Filters
                </button>
                <button 
                    type="submit"
                    className="px-6 py-2 bg-rose-500 text-white rounded-md text-sm font-medium hover:bg-rose-600"
                >
                    Apply Filters
                </button>
            </div>
          </form>
        </div>
        
        {/* Results Section */}
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
                  venue={exhibition.venue}
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
    </>
  );
}

export default function ExhibitionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
        <ExhibitionsContent />
      </Suspense>
    </div>
  );
}