// src/app/date-search/page.tsx - Fixed version
'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import ExhibitionCard from '@/components/ExhibitionCard';
import Link from 'next/link';
import Select from 'react-select';

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

// Interface for react-select options
interface SelectOption {
  value: string;
  label: string;
}

// --- European Countries List (Copied from exhibitions/page.tsx) ---
const EUROPEAN_COUNTRIES = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", 
  "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", 
  "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", 
  "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", 
  "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", 
  "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", 
  "Turkey", "Ukraine", "United Kingdom", "UK", "Vatican City"
].sort();

const europeanCountryOptions: SelectOption[] = EUROPEAN_COUNTRIES.map(country => ({
  value: country,
  label: country
}));
// ------------------------------------------------------------------

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
  const [loadingExhibitions, setLoadingExhibitions] = useState<boolean>(true);
  const [loadingOptions, setLoadingOptions] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);
  const [selectedCities, setSelectedCities] = useState<SelectOption[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<SelectOption[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<SelectOption[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(null);
  const [artistOptions, setArtistOptions] = useState<SelectOption[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<SelectOption | null>(null);
  
  // For day planning
  const [selectedExhibitions, setSelectedExhibitions] = useState<string[]>([]);

  // --- Function to Fetch Filter Options --- 
  const fetchFilterOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const params = new URLSearchParams();
      // Build query based on CURRENT state for options
      if (useDateRange) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('startDate', startDate);
        params.append('endDate', startDate);
      }
      if (selectedCountries.length > 0) params.append('countries', selectedCountries.map(c => c.value).join(','));
      if (selectedCities.length > 0) params.append('cities', selectedCities.map(c => c.value).join(','));
      if (selectedCategory) params.append('category', selectedCategory.value);
      if (selectedArtist) params.append('artist', selectedArtist.value);

      // Call API just for options (ideally API supports this, otherwise we ignore data)
      const apiUrl = `/api/exhibitions?${params.toString()}`;
      console.log("Fetching FILTER OPTIONS from:", apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch filter options');
      const data = await response.json();

      if (data.success && data.meta?.filter_options) {
        const options = data.meta.filter_options;
        const newCityOptions = (options.cities || []).map((city: string) => ({ value: city, label: city }));
        const newCategoryOptions = (options.categories || []).map((cat: string) => ({ value: cat, label: cat }));
        const newArtistOptions = (options.artists || []).map((art: string) => ({ value: art, label: art }));

        setCityOptions(newCityOptions);
        setCategoryOptions(newCategoryOptions);
        setArtistOptions(newArtistOptions);

        // --- Validate and potentially clear existing selections (Smarter Check) --- 
        setSelectedCities(prev => {
            const validSelected = prev.filter(selected => newCityOptions.some((opt: SelectOption) => opt.value === selected.value));
            // Only update if the array content actually changed (simple length/value check)
            if (validSelected.length !== prev.length || !validSelected.every((v, i) => v.value === prev[i]?.value)) {
                return validSelected;
            }
            return prev; // Keep previous state reference if no change
        });
        setSelectedCategory(prev => {
            const isValid = newCategoryOptions.some((opt: SelectOption) => opt.value === prev?.value);
            if (isValid) return prev; // Keep if valid
            if (!isValid && prev !== null) return null; // Clear if invalid and was not already null
            return prev; // Keep null if it was already null
        });
         setSelectedArtist(prev => {
            const isValid = newArtistOptions.some((opt: SelectOption) => opt.value === prev?.value);
            if (isValid) return prev; // Keep if valid
            if (!isValid && prev !== null) return null; // Clear if invalid and was not already null
            return prev; // Keep null if it was already null
        });
      } else {
        throw new Error(data.error || 'Failed to parse filter options');
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
      // Don't set main error state, maybe a specific options error?
      // Reset options to empty on error?
      setCityOptions([]);
      setCategoryOptions([]);
      setArtistOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  }, [startDate, endDate, useDateRange, selectedCountries, selectedCities, selectedCategory, selectedArtist]); // Dependencies for fetching options

  // --- Function to Fetch Actual Exhibitions --- 
  const fetchExhibitionResults = useCallback(async () => {
    setLoadingExhibitions(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      // Build query based on CURRENT state for results
      if (useDateRange) {
        params.append('startDate', startDate);
        params.append('endDate', endDate);
      } else {
        params.append('startDate', startDate);
        params.append('endDate', startDate);
      }
      if (selectedCountries.length > 0) params.append('countries', selectedCountries.map(c => c.value).join(','));
      if (selectedCities.length > 0) params.append('cities', selectedCities.map(c => c.value).join(','));
      if (selectedCategory) params.append('category', selectedCategory.value);
      if (selectedArtist) params.append('artist', selectedArtist.value);

      const apiUrl = `/api/exhibitions?${params.toString()}`;
      console.log("Fetching EXHIBITION RESULTS from:", apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch exhibitions: ${response.statusText} - ${errorData?.error || 'Unknown error'}`);
      }
      const data = await response.json();
      if (data.success) {
        setExhibitions(data.data);
        // We can optionally update options here too, but fetchFilterOptions is primary
      } else {
        throw new Error(data.error || 'Failed to fetch exhibitions from API');
      }
    } catch (err: any) {
      console.error('Error fetching exhibition results:', err);
      setError(err.message || 'Failed to load exhibitions');
      setExhibitions([]);
    } finally {
      setLoadingExhibitions(false);
    }
  }, [startDate, endDate, useDateRange, selectedCountries, selectedCities, selectedCategory, selectedArtist]); // Dependencies for fetching results

  // --- Effects --- 

  // Initial load: Set state from URL params, then fetch options and results
  useEffect(() => {
    let initialStartDate = formattedToday;
    let initialEndDate = formattedDefaultEnd;
    let initialUseRange = false;
    let initialCityValues: string[] = [];
    let initialCountryValues: string[] = [];
    let initialCategoryValue = '';
    let initialArtistValue = '';

    if (searchParams) {
      const startDateParam = searchParams.get('startDate');
      const endDateParam = searchParams.get('endDate');
      const citiesParam = searchParams.get('cities'); 
      const countriesParam = searchParams.get('countries'); 
      const categoryParam = searchParams.get('category');
      const artistParam = searchParams.get('artist'); 

      if (startDateParam) initialStartDate = startDateParam;
      if (endDateParam) {
        initialEndDate = endDateParam;
        initialUseRange = true; 
      }
      if (citiesParam) initialCityValues = citiesParam.split(',').filter(Boolean);
      if (countriesParam) initialCountryValues = countriesParam.split(',').filter(Boolean);
      if (categoryParam) initialCategoryValue = categoryParam;
      if (artistParam) initialArtistValue = artistParam; 
    }
    
    // Set initial state values (basic ones)
    setStartDate(initialStartDate);
    setEndDate(initialEndDate);
    setUseDateRange(initialUseRange);
    
    // Set initial country selection (static options)
    const initialCountries = europeanCountryOptions.filter(opt => initialCountryValues.includes(opt.value));
    setSelectedCountries(initialCountries);
    
    // Set initial selections for dropdowns that depend on fetched options
    // We set these temporarily, fetchFilterOptions will validate them
    setSelectedCategory(initialCategoryValue ? { value: initialCategoryValue, label: initialCategoryValue } : null);
    setSelectedArtist(initialArtistValue ? { value: initialArtistValue, label: initialArtistValue } : null);
    setSelectedCities(initialCityValues.map(v => ({ value: v, label: v })));

    // Fetch initial options based on URL state
    fetchFilterOptions(); // This will validate/correct selections
    // Fetch initial results based on URL state
    fetchExhibitionResults();

  }, [searchParams]); // IMPORTANT: Only run on searchParams change (initial load / back/forward nav)

  // Fetch OPTIONS when relevant filters change
  useEffect(() => {
    // Avoid fetching on initial render if searchParams effect already did
    if (loadingExhibitions) return; 
    
    fetchFilterOptions();
  // Only fetch options primarily based on Date and Country changes
  // Changes in City/Category/Artist shouldn't refetch the options list itself in this simplified model
  }, [startDate, endDate, useDateRange, selectedCountries, fetchFilterOptions]); 

  // --- Handlers --- 

  // Handle Submit Button: Fetches main results
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    if (useDateRange) {
      params.set('startDate', startDate);
      params.set('endDate', endDate);
    } else {
      params.set('startDate', startDate);
    }
    if (selectedCities.length > 0) params.set('cities', selectedCities.map(c => c.value).join(','));
    if (selectedCountries.length > 0) params.set('countries', selectedCountries.map(c => c.value).join(','));
    if (selectedCategory) params.set('category', selectedCategory.value);
    if (selectedArtist) params.set('artist', selectedArtist.value);
    
    // Update URL
    router.push(`/date-search?${params.toString()}`);
    
    // Fetch results
    fetchExhibitionResults();
  };
  
  // Multi-select handler (Country, City)
  const handleMultiSelectChange = (selectedOptions: readonly SelectOption[] | null, filterType: 'country' | 'city') => {
      const optionsArray = selectedOptions ? Array.from(selectedOptions) : [];
      if (filterType === 'country') {
          setSelectedCountries(optionsArray);
          // When country changes, clear city selection as options will refresh
          setSelectedCities([]); 
      } else if (filterType === 'city') {
          setSelectedCities(optionsArray);
      }
      // Options will be fetched via the useEffect hook watching these states
  };

  // Single-select handler (Category, Artist)
  const handleSingleSelectChange = (selectedOption: SelectOption | null, filterType: 'category' | 'artist') => {
      if (filterType === 'category') {
          setSelectedCategory(selectedOption);
      } else if (filterType === 'artist') {
          setSelectedArtist(selectedOption);
      }
       // Options will be fetched via the useEffect hook watching category state
       // Artist change doesn't require fetching options for other fields
  };

  // Clear Filters
  const clearFilters = () => {
      // Reset state to defaults
      const today = new Date().toISOString().split('T')[0];
      const defaultEnd = new Date();
      defaultEnd.setDate(new Date().getDate() + 7);
      const formattedDefaultEnd = defaultEnd.toISOString().split('T')[0];
      
      setStartDate(today);
      setEndDate(formattedDefaultEnd);
      setUseDateRange(false);
      setSelectedCities([]);
      setSelectedCountries([]);
      setSelectedCategory(null);
      setSelectedArtist(null);
      setError(null);
      
      // Clear URL
      router.push('/date-search'); 
      
      // Fetch default options and results
      fetchFilterOptions(); 
      fetchExhibitionResults(); 
  };

  // Other functions (handleExhibitionSelection, startPlanningDay, formatDateForDisplay) remain the same
  const handleExhibitionSelection = (exhibitionId: string) => {
    setSelectedExhibitions(prev => 
      prev.includes(exhibitionId) ? prev.filter(id => id !== exhibitionId) : [...prev, exhibitionId]
    );
  };
  
  const startPlanningDay = () => {
    const planStartDate = startDate; 
    router.push(`/day-planner?date=${planStartDate}&exhibitions=${selectedExhibitions.join(',')}`);
  };
  
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {useDateRange ? (
                <>
                  <div className="md:col-span-1">
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
                  
                  <div className="md:col-span-1">
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
                <div className="md:col-span-2 lg:col-span-1">
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
              
              <div className="lg:col-span-1">
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
                  isDisabled={loadingOptions}
                />
              </div>
              
              <div className="lg:col-span-1">
                <label htmlFor="cities-select" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <Select<SelectOption, true>
                  id="cities-select"
                  instanceId="cities-select-instance"
                  isMulti
                  options={cityOptions}
                  value={selectedCities}
                  onChange={(options) => handleMultiSelectChange(options, 'city')}
                  isClearable={true}
                  placeholder="Select cities..."
                  noOptionsMessage={() => 'No cities found for selection'}
                  isDisabled={loadingOptions || selectedCountries.length === 0}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  closeMenuOnSelect={false}
                />
              </div>
              
              <div className="lg:col-span-1">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <Select<SelectOption>
                  id="category"
                  instanceId="category-select"
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={(option) => handleSingleSelectChange(option, 'category')}
                  isClearable={true}
                  placeholder="Select a category..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isDisabled={loadingOptions}
                />
              </div>

              <div className="lg:col-span-1">
                <label htmlFor="artist" className="block text-sm font-medium text-gray-700 mb-1">
                  Artist
                </label>
                <Select<SelectOption>
                  id="artist"
                  instanceId="artist-select"
                  options={artistOptions}
                  value={selectedArtist}
                  onChange={(option) => handleSingleSelectChange(option, 'artist')}
                  isClearable={true}
                  placeholder="Select an artist..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isDisabled={loadingOptions}
                />
              </div>
            </div>
            
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
                className="bg-rose-500 hover:bg-rose-600 text-white font-medium py-2 px-6 rounded transition-colors"
              >
                Search Exhibitions
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
              {selectedCountries.length > 0 && ` in ${selectedCountries.map(c => c.label).join(', ')}`}
              {selectedCities.length > 0 && ` (${selectedCities.map(c => c.label).join(', ')})`}
              {selectedCategory && `, ${selectedCategory.label} category`}
              {selectedArtist && ` by ${selectedArtist.label}`}
            </h2>
          </div>
        )}
        
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
        
        {loadingExhibitions ? (
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