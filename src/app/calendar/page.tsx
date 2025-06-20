'use client';

import React from 'react';
import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
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

// Helper function to format date as YYYY-MM-DD string
function formatDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
  
  // --- Refactored State Management ---
  const [view, setView] = useState({ year: currentYear, month: currentMonth });
  const [filters, setFilters] = useState<{ countries: SelectOption[], city: SelectOption | null }>({
    countries: [],
    city: null
  });

  const [calendarCells, setCalendarCells] = useState<CalendarCell[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // --- Effect for Initial Load ---
  // Runs only once to set the initial state from URL search params.
  useEffect(() => {
    console.log("Initial load: setting state from URL");
    const searchParams = new URLSearchParams(window.location.search);
    const initialYear = parseInt(searchParams.get('year') || currentYear.toString());
    const initialMonth = parseInt(searchParams.get('month') || currentMonth.toString());
    const initialCountryValues = (searchParams.get('countries') || '').split(',').filter(Boolean);
    const initialCityValue = searchParams.get('city') || null;

    setView({ year: initialYear, month: initialMonth });
    
    const initialCountries = europeanCountryOptions.filter(opt => initialCountryValues.includes(opt.value));
    setFilters({
      countries: initialCountries,
      city: initialCityValue ? { value: initialCityValue, label: initialCityValue } : null
    });
    
    // The main data fetching effect will now be triggered by this state change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Main Data Fetching and URL Update Effect ---
  // This is the single source of truth for fetching data.
  // It runs whenever the view (year, month) or filters (countries, city) change.
  useEffect(() => {
    console.log("Data fetching effect triggered by view or filter change", { view, filters });

    const cells = getMonthDates(view.year, view.month);
    setCalendarCells(cells);
    
    // Update URL to reflect the new state
    const params = new URLSearchParams();
    params.set('year', view.year.toString());
    params.set('month', view.month.toString());
    if (filters.countries.length > 0) params.set('countries', filters.countries.map(c => c.value).join(','));
    if (filters.city) params.set('city', filters.city.value);
    window.history.replaceState({ path: `${window.location.pathname}?${params.toString()}` }, '', `${window.location.pathname}?${params.toString()}`);

    // Fetch exhibitions based on the current view and filters
    if (cells.length > 0) {
      const startDate = cells[0].date;
      const endDate = cells[cells.length - 1].date;
      fetchExhibitions(startDate, endDate, filters.countries.map(c => c.value), filters.city?.value || null);
    }
  }, [view, filters]);

  // --- API Call Function ---
  // This function NO LONGER sets state directly. It returns data.
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
      console.log("Fetching exhibitions from:", apiUrl);
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error('Failed to fetch exhibitions');
      
      const data = await response.json();
      if (data.success) {
        setExhibitions(data.data);
        const newCityOptions = (data.meta?.filter_options?.cities || []).map((city: string) => ({ value: city, label: city }));
        setCityOptions(newCityOptions);

        // Validate city filter based on new options
        const isCurrentCityValid = newCityOptions.some((opt: SelectOption) => opt.value === cityValue);
        if (!isCurrentCityValid && cityValue) {
          // If city is no longer valid, we update the filter state, which will trigger a refetch.
          setFilters(prev => ({ ...prev, city: null }));
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
  
  // --- Navigation functions --- 
  // These now update the 'view' state object.
  const goToPreviousMonth = () => {
    setView(prev => {
      const newMonth = prev.month > 0 ? prev.month - 1 : 11;
      const newYear = prev.month > 0 ? prev.year : prev.year - 1;
      return { year: newYear, month: newMonth };
    });
  };
  
  const goToNextMonth = () => {
    setView(prev => {
      const newMonth = prev.month < 11 ? prev.month + 1 : 0;
      const newYear = prev.month < 11 ? prev.year : prev.year + 1;
      return { year: newYear, month: newMonth };
    });
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

  // --- Event Handlers ---
  // These now update the 'filters' state object.
  const handleCountryChange = (selectedOptions: readonly SelectOption[] | null) => {
    const optionsArray = selectedOptions ? Array.from(selectedOptions) : [];
    setFilters({ countries: optionsArray, city: null }); // Reset city when country changes
  };

  const handleCityChange = (selectedOption: SelectOption | null) => {
    setFilters(prev => ({ ...prev, city: selectedOption }));
  };

  const handleDayClick = (dateStr: string) => {
    router.push(`/date-search?date=${dateStr}`);
  };

  return (
    <>
      <main className="container-wide py-6 sm:py-8">
        <div className="card-minimal p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-serif text-[var(--primary)] mb-4 sm:mb-0">Exhibition Calendar</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button onClick={goToPreviousMonth} className="p-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors" aria-label="Previous month">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </button>
              <div className="text-base sm:text-lg font-medium text-center min-w-[120px] sm:w-32">
                 {formatHeaderDate(view.year, view.month)}
              </div>
              <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-[var(--primary-light)] transition-colors" aria-label="Next month">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
             <div className="w-full">
               <label htmlFor="countries-select" className="block text-sm font-medium text-[var(--foreground)] mb-1">Filter by Country</label>
               <Select<SelectOption, true> 
                 id="countries-select" instanceId="countries-select-instance" isMulti
                 options={europeanCountryOptions} value={filters.countries} 
                 onChange={handleCountryChange} 
                 placeholder="All European Countries..."
                 className="react-select-container"
                 classNamePrefix="react-select"
                 closeMenuOnSelect={false}
               />
             </div>
             <div className="w-full">
               <label htmlFor="city-select" className="block text-sm font-medium text-[var(--foreground)] mb-1">Filter by City</label>
               <Select<SelectOption> 
                 id="city-select" instanceId="city-select-instance" 
                 options={cityOptions} value={filters.city} 
                 onChange={handleCityChange} 
                 isClearable={true} placeholder="All Cities..." 
                 noOptionsMessage={() => filters.countries.length === 0 ? 'Select country first' : 'No cities found'}
                 isDisabled={loading}
                 className="react-select-container"
                 classNamePrefix="react-select"
               />
             </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--secondary)]"></div></div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">{error}</div>
          ) : (
            <>
              {/* Desktop Calendar */}
              <div className="hidden sm:grid grid-cols-[auto_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-px border-l border-t border-[var(--border)] bg-[var(--border)]">
                <div className="bg-[var(--primary-light)] py-2 pl-1 pr-2 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-r border-b border-[var(--border)]">Wk</div>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                  <div key={`header-${day}`} className="bg-[var(--primary-light)] py-2 text-center text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider border-r border-b border-[var(--border)]">{day}</div>
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
                                    title={`${exhibition.title} (${exhibition.location ? exhibition.location.name : 'Unknown Location'})`}
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
              
              {/* Mobile Calendar */}
              <div className="sm:hidden">
                <div className="space-y-3">
                  {calendarCells.filter(cell => !cell.weekNumber).map((cell) => {
                    const dateStr = formatDateString(cell.date);
                    const dayExhibitions = getExhibitionsForDate(cell.date);
                    if (!cell.isCurrentMonth || dayExhibitions.length === 0) return null;
                    
                    return (
                      <div
                        key={dateStr}
                        className={`rounded-lg p-3 ${cell.isToday ? 'bg-[var(--secondary)]/10 border-2 border-[var(--secondary)]' : 'bg-[var(--primary-light)]'}`}
                        onClick={() => handleDayClick(dateStr)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className={`font-semibold ${cell.isToday ? 'text-[var(--secondary)]' : 'text-[var(--primary)]'}`}>
                            {cell.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </div>
                          <div className="text-sm text-[var(--text-muted)]">
                            {dayExhibitions.length} exhibition{dayExhibitions.length > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {dayExhibitions.slice(0, 3).map((exhibition) => (
                            <Link 
                              key={exhibition._id} 
                              href={`/exhibition/${exhibition._id}`}
                              className="block text-sm truncate hover:text-[var(--secondary)] transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {exhibition.title}
                            </Link>
                          ))}
                          {dayExhibitions.length > 3 && (
                            <div className="text-sm text-[var(--text-muted)]">
                              +{dayExhibitions.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {calendarCells.filter(cell => !cell.weekNumber && cell.isCurrentMonth && getExhibitionsForDate(cell.date).length > 0).length === 0 && (
                  <div className="text-center py-8 text-[var(--text-muted)]">
                    No exhibitions this month
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        <div className="text-center mb-8">
          <Link href="/date-search" className="text-[var(--secondary)] hover:underline">Go to date search to plan a specific day</Link>
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