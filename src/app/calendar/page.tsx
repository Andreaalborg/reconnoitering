'use client';

import React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import Select from 'react-select';

interface Exhibition {
  _id: string;
  title: string;
  location: {
    name: string;
    city: string;
    country: string;
  };
  startDate: string;
  endDate: string;
  category: string[];
  ticketPrice?: string;
  ticketUrl?: string;
}

// Interface for a calendar cell
interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  weekNumber?: number; // Add week number here
}

// Helper function to get week number of a date (ISO 8601)
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7; // Get Day
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); // Adjust to Thursday in same week
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    // Calculate full weeks to nearest Thursday
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

// Helper function to get all dates to display in a month view
function getMonthDates(year: number, month: number): CalendarCell[] {
    const monthDates: CalendarCell[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize today

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    // Calculate start day: Monday of the week containing the 1st of the month
    const startDay = new Date(firstDayOfMonth);
    const dayOfWeek = firstDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
    const diff = startDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Adjust to Monday
    startDay.setDate(diff);

    // Calculate end day: Sunday of the week containing the last day of the month
    const endDay = new Date(lastDayOfMonth);
    const endDayOfWeek = lastDayOfMonth.getDay(); // 0=Sun, 1=Mon, ...
    const endDiff = endDay.getDate() + (endDayOfWeek === 0 ? 0 : 7 - endDayOfWeek); // Adjust to Sunday
    endDay.setDate(endDiff);

    // Generate dates
    let currentDay = new Date(startDay);
    while (currentDay <= endDay) {
        const isCurrentMonth = currentDay.getMonth() === month;
        const dateWithoutTime = new Date(currentDay);
        dateWithoutTime.setHours(0, 0, 0, 0);
        const isTodayFlag = dateWithoutTime.getTime() === today.getTime();
        
        // Calculate week number only for Mondays
        const weekNum = (currentDay.getDay() === 1) ? getWeekNumber(currentDay) : undefined;

        monthDates.push({
            date: new Date(currentDay),
            isCurrentMonth,
            isToday: isTodayFlag,
            weekNumber: weekNum
        });
        currentDay.setDate(currentDay.getDate() + 1);
    }

    return monthDates;
}

// --- Add SelectOption interface and European Countries (copied from other pages) ---
interface SelectOption {
  value: string;
  label: string;
}

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
// ---------------------------------------------------------------------------

function CalendarContent() {
  const router = useRouter();
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-11
  
  const searchParams = new URLSearchParams(
    typeof window !== 'undefined' ? window.location.search : ''
  );
  
  // --- Updated State --- 
  const [year, setYear] = useState<number>(
    parseInt(searchParams.get('year') || currentYear.toString())
  );
  const [month, setMonth] = useState<number>(
    parseInt(searchParams.get('month') || currentMonth.toString())
  );
  const [selectedCountries, setSelectedCountries] = useState<SelectOption[]>([]); // Added for countries
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]); // Added for city options
  const [selectedCity, setSelectedCity] = useState<SelectOption | null>(null); // Changed to SelectOption or null
  
  const [calendarCells, setCalendarCells] = useState<CalendarCell[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- Updated useEffect (Simplified Dependencies) ---
  useEffect(() => {
    // This effect now ONLY runs when year or month changes.
    // It's responsible for updating the cells and fetching data for the new view.

    console.log(`useEffect for [year, month] triggered: ${year}-${month}`); // Debug log

    const cells = getMonthDates(year, month);
    setCalendarCells(cells);

    // Update URL reflecting the current VIEW (year, month) and FILTERS (read from state)
    const params = new URLSearchParams();
    params.set('year', year.toString());
    params.set('month', month.toString());
    // Read current filter state when updating URL
    if (selectedCountries.length > 0) params.set('countries', selectedCountries.map(c => c.value).join(','));
    if (selectedCity) params.set('city', selectedCity.value);
    
    if (typeof window !== 'undefined') {
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        // Use replaceState for view changes to avoid excessive history
        window.history.replaceState({ path: newUrl }, '', newUrl); 
    }

    // Fetch exhibitions for the NEW view (year/month) using CURRENT filters
    if (cells.length > 0) {
        const startDate = cells[0].date;
        const endDate = cells[cells.length - 1].date;
        fetchExhibitions(startDate, endDate, selectedCountries.map(c => c.value), selectedCity?.value || null);
    }

  // Depend ONLY on year and month for view changes
  }, [year, month]); // REMOVED selectedCountries, selectedCity

  // --- Initial Load Effect (Separate, runs once) ---
  useEffect(() => {
    console.log("Initial load useEffect triggered"); // Debug log
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const initialYear = parseInt(searchParams.get('year') || currentYear.toString());
    const initialMonth = parseInt(searchParams.get('month') || currentMonth.toString());
    const initialCountryValues = (searchParams.get('countries') || '').split(',').filter(Boolean);
    const initialCityValue = searchParams.get('city') || null;

    // Set initial view state ONLY if different from default
    let viewChanged = false;
    if (initialYear !== currentYear) {
      setYear(initialYear);
      viewChanged = true;
    }
    if (initialMonth !== currentMonth) {
      setMonth(initialMonth);
      viewChanged = true;
    }

    // Set initial filter state REGARDLESS of view change
    const initialCountries = europeanCountryOptions.filter(opt => initialCountryValues.includes(opt.value));
    setSelectedCountries(initialCountries);
    // Set temporary city state before fetch validates
    setSelectedCity(initialCityValue ? { value: initialCityValue, label: initialCityValue } : null);

    // Generate initial cells based on initial/default view
    const cells = getMonthDates(initialYear, initialMonth);
    setCalendarCells(cells);

    // Initial fetch logic:
    // If viewChanged is true, the other useEffect [year, month] will trigger the fetch.
    // If view hasn't changed, we need to trigger the fetch manually here with initial filters.
    if (!viewChanged && cells.length > 0) {
        console.log("Initial view matches state, fetching manually with initial filters");
        const startDate = cells[0].date;
        const endDate = cells[cells.length - 1].date;
        fetchExhibitions(startDate, endDate, initialCountries.map(c => c.value), initialCityValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount
  
  // --- Updated fetchExhibitions (Validation logic remains the same) --- 
  const fetchExhibitions = async (startDate: Date, endDate: Date, countryValues: string[], cityValue: string | null) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('startDate', startDate.toISOString().split('T')[0]);
      params.set('endDate', endDate.toISOString().split('T')[0]);
      if (countryValues.length > 0) params.set('countries', countryValues.join(','));
      if (cityValue) params.set('city', cityValue);
      
      const apiUrl = `/api/exhibitions?${params.toString()}`;
      console.log("Fetching exhibitions for calendar from:", apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch exhibitions');
      const data = await response.json();
      
      if (data.success) {
        setExhibitions(data.data);
        if (data.meta?.filter_options) {
          const newCityOptions = (data.meta.filter_options.cities || []).map((city: string) => ({ value: city, label: city }));
          setCityOptions(newCityOptions);
          setSelectedCity(prev => {
            const isValid = newCityOptions.some(opt => opt.value === prev?.value);
            if (isValid) return prev; 
            if (!isValid && prev !== null) return null; 
            return prev; 
          });
        } else {
            setCityOptions([]); 
            setSelectedCity(null); 
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
  
  // --- Navigation functions (remain the same) --- 
  const goToPreviousMonth = () => {
    if (month > 0) {
      setMonth(month - 1);
    } else {
      setYear(year - 1);
      setMonth(11); // December
    }
  };
  
  const goToNextMonth = () => {
    if (month < 11) {
      setMonth(month + 1);
    } else {
      setYear(year + 1);
      setMonth(0); // January
    }
  };
  
  // Helper function to get exhibitions for a specific date (remains the same)
  const getExhibitionsForDate = (date: Date): Exhibition[] => {
    const dateString = date.toISOString().split('T')[0];
    return exhibitions.filter(exhibition => {
      const startDate = new Date(exhibition.startDate);
      const endDate = new Date(exhibition.endDate);
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      return dateString >= startDateString && dateString <= endDateString;
    });
  };
  
  // Format date for cell display (only day number)
  const formatCellDate = (date: Date): string => {
    return date.getDate().toString();
  };
  
  // Format month/year for header
  const formatHeaderDate = (year: number, month: number): string => {
      const date = new Date(year, month, 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // --- Updated Handlers to trigger fetch and URL update --- 
  const handleCountryChange = (selectedOptions: readonly SelectOption[] | null) => {
      const optionsArray = selectedOptions ? Array.from(selectedOptions) : [];
      console.log("Country changed, setting state and fetching..."); // Debug log
      setSelectedCountries(optionsArray);
      setSelectedCity(null); // Clear city

      // Update URL immediately
      const params = new URLSearchParams(window.location.search);
      if (optionsArray.length > 0) params.set('countries', optionsArray.map(c => c.value).join(','));
      else params.delete('countries');
      params.delete('city'); // City was cleared
      window.history.pushState({ path: `${window.location.pathname}?${params.toString()}` }, '', `${window.location.pathname}?${params.toString()}`);

      // Manually trigger fetch after state updates, using current cells
      const cells = calendarCells; 
      if (cells.length > 0) {
          const startDate = cells[0].date;
          const endDate = cells[cells.length - 1].date;
          fetchExhibitions(startDate, endDate, optionsArray.map(c => c.value), null); // Fetch with new countries, null city
      } else {
          console.warn("Cannot fetch, calendar cells not ready.");
      }
  };

  const handleCityChange = (selectedOption: SelectOption | null) => {
      console.log("City changed, setting state and fetching..."); // Debug log
      setSelectedCity(selectedOption);

      // Update URL immediately
      const params = new URLSearchParams(window.location.search);
      if (selectedOption) params.set('city', selectedOption.value);
      else params.delete('city');
      window.history.pushState({ path: `${window.location.pathname}?${params.toString()}` }, '', `${window.location.pathname}?${params.toString()}`);

      // Manually trigger fetch after state updates, using current cells
      const cells = calendarCells; 
      if (cells.length > 0) {
          const startDate = cells[0].date;
          const endDate = cells[cells.length - 1].date;
          // Fetch with current countries and new city
          fetchExhibitions(startDate, endDate, selectedCountries.map(c => c.value), selectedOption?.value || null);
      } else {
          console.warn("Cannot fetch, calendar cells not ready.");
      }
  };

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Exhibition Calendar</h1>
            <div className="flex items-center space-x-4">
              <button onClick={goToPreviousMonth} className="p-2 rounded-full hover:bg-gray-100" aria-label="Previous month">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </button>
              <div className="text-lg font-medium text-center w-32">
                 {formatHeaderDate(year, month)}
              </div>
              <button onClick={goToNextMonth} className="p-2 rounded-full hover:bg-gray-100" aria-label="Next month">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row md:space-x-4 mb-6">
             <div className="w-full md:w-1/2 lg:w-1/3 mb-4 md:mb-0">
               <label htmlFor="countries-select" className="block text-sm font-medium text-gray-700 mb-1">Filter by Country</label>
               <Select<SelectOption, true> 
                 id="countries-select" instanceId="countries-select-instance" isMulti
                 options={europeanCountryOptions} value={selectedCountries} 
                 onChange={handleCountryChange} 
                 placeholder="All European Countries..."
                 className="react-select-container"
                 classNamePrefix="react-select"
                 closeMenuOnSelect={false}
               />
             </div>
             <div className="w-full md:w-1/2 lg:w-1/3">
               <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 mb-1">Filter by City</label>
               <Select<SelectOption> 
                 id="city-select" instanceId="city-select-instance" 
                 options={cityOptions} value={selectedCity} 
                 onChange={handleCityChange} 
                 isClearable={true} placeholder="All Cities..." 
                 noOptionsMessage={() => selectedCountries.length === 0 ? 'Select country first' : 'No cities found'}
                 isDisabled={loading}
                 className="react-select-container"
                 classNamePrefix="react-select"
               />
             </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">{error}</div>
          ) : (
            <div className="grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-px border-l border-t border-gray-200 bg-gray-200">
              <div className="bg-gray-50 py-2 pl-1 pr-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-b border-gray-200">Wk</div>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={`header-${day}`} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r border-b border-gray-200">{day}</div>
              ))}
              
              {calendarCells.map((cell, index) => {
                  const isMonday = cell.date.getDay() === 1;
                  const weekNumberCell = isMonday ? (
                      <div 
                          key={`week-${cell.weekNumber}`} 
                          className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-400 border-r border-b border-gray-200 flex items-center justify-center"
                      >
                          {cell.weekNumber}
                      </div>
                  ) : null;

                  const dayExhibitions = getExhibitionsForDate(cell.date);
                  return (
                    <React.Fragment key={`day-${index}`}>
                      {weekNumberCell}
                      <div className={`relative min-h-[120px] border-r border-b border-gray-200 ${cell.isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400'}`}> 
                        <div className={`absolute top-1 right-1 text-xs p-1 rounded ${cell.isToday ? 'bg-rose-500 text-white font-bold' : ''}`}>
                          {formatCellDate(cell.date)}
                        </div>
                        {cell.isCurrentMonth && dayExhibitions.length > 0 && (
                           <div className="pt-6 px-1 pb-1 space-y-1 overflow-y-auto max-h-[100px]">
                              {dayExhibitions.map((exhibition) => (
                                <Link 
                                    key={exhibition._id} 
                                    href={`/exhibition/${exhibition._id}`}
                                    className="block text-xs leading-snug px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 truncate"
                                    title={`${exhibition.title} (${exhibition.location.name})`}
                                >
                                  {exhibition.title}
                                </Link>
                              ))}
                            </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
              })}
            </div>
          )}
        </div>
        <div className="text-center mb-8">
          <Link href="/date-search" className="text-rose-500 hover:underline">Go to date search to plan a specific day</Link>
        </div>
      </main>
    </>
  );
}

export default function CalendarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
        <CalendarContent />
      </Suspense>
    </div>
  );
}