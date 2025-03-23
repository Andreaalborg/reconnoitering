'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';

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

export default function CalendarView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Today's date if not specified
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentWeek = getWeekNumber(today);
  
  // Get year and week from URL or use current
  const [year, setYear] = useState<number>(
    parseInt(searchParams.get('year') || currentYear.toString())
  );
  const [week, setWeek] = useState<number>(
    parseInt(searchParams.get('week') || currentWeek.toString())
  );
  const [selectedCity, setSelectedCity] = useState<string>(
    searchParams.get('city') || ''
  );
  
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  
  // Generate dates for the selected week
  useEffect(() => {
    const dates = getWeekDates(year, week);
    setWeekDates(dates);
    
    // Update URL with current selection
    const params = new URLSearchParams();
    params.set('year', year.toString());
    params.set('week', week.toString());
    if (selectedCity) {
      params.set('city', selectedCity);
    }
    
    router.push(`/calendar?${params.toString()}`, { scroll: false });
    
    // Fetch exhibitions for this week
    fetchExhibitions(dates[0], dates[6]);
  }, [year, week, selectedCity]);
  
  // Fetch exhibitions within date range
  const fetchExhibitions = async (startDate: Date, endDate: Date) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      params.set('startDate', startDate.toISOString().split('T')[0]);
      params.set('endDate', endDate.toISOString().split('T')[0]);
      
      if (selectedCity) {
        params.set('city', selectedCity);
      }
      
      const response = await fetch(`/api/exhibitions?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exhibitions');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setExhibitions(data.data);
        
        // Get unique cities for the filter
        if (data.meta && data.meta.filter_options) {
          setCities(data.meta.filter_options.cities || []);
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
  
  // Navigation functions
  const goToPreviousWeek = () => {
    if (week > 1) {
      setWeek(week - 1);
    } else {
      // Go to last week of previous year
      setYear(year - 1);
      setWeek(getWeeksInYear(year - 1));
    }
  };
  
  const goToNextWeek = () => {
    const weeksInYear = getWeeksInYear(year);
    if (week < weeksInYear) {
      setWeek(week + 1);
    } else {
      // Go to first week of next year
      setYear(year + 1);
      setWeek(1);
    }
  };
  
  // Helper function to get exhibitions for a specific date
  const getExhibitionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    return exhibitions.filter(exhibition => {
      const startDate = new Date(exhibition.startDate);
      const endDate = new Date(exhibition.endDate);
      
      // Convert to date strings for comparison
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      
      return dateString >= startDateString && dateString <= endDateString;
    });
  };
  
  // Helper function to get week number of a date
  function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }
  
  // Helper function to get all dates in a week
  function getWeekDates(year: number, weekNumber: number): Date[] {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysToFirstMonday = 8 - (firstDayOfYear.getDay() || 7);
    
    // Get the first Monday of the year
    const firstMonday = new Date(year, 0, daysToFirstMonday);
    
    // Calculate the Monday of the requested week
    const targetMonday = new Date(firstMonday);
    targetMonday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);
    
    // Generate array of dates for the week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(targetMonday);
      date.setDate(targetMonday.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  }
  
  // Helper function to get the number of weeks in a year
  function getWeeksInYear(year: number): number {
    const d = new Date(year, 11, 31);
    const week = getWeekNumber(d);
    return week === 1 ? getWeekNumber(new Date(year, 11, 24)) : week;
  }
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric',
      month: 'short'
    });
  };
  
  // Check if date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Exhibition Calendar</h1>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={goToPreviousWeek}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Previous week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <div className="text-lg font-medium">
                Week {week}, {year}
              </div>
              
              <button
                onClick={goToNextWeek}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Next week"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="flex mb-4">
            <div className="w-full md:w-64">
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">Filter by City</label>
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
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-4">
              {/* Day headers */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <div key={`header-${index}`} className="text-center font-medium p-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar cells */}
              {weekDates.map((date, index) => {
                const dayExhibitions = getExhibitionsForDate(date);
                const isCurrentDay = isToday(date);
                
                return (
                  <div 
                    key={`day-${index}`} 
                    className={`border rounded-lg min-h-[180px] overflow-hidden ${
                      isCurrentDay ? 'border-rose-500 bg-rose-50' : 'border-gray-200'
                    }`}
                  >
                    <div className={`text-center py-1 font-medium ${
                      isCurrentDay ? 'bg-rose-500 text-white' : 'bg-gray-100'
                    }`}>
                      {formatDate(date)}
                    </div>
                    
                    <div className="p-2 overflow-y-auto max-h-[300px]">
                      {dayExhibitions.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-2">No exhibitions</p>
                      ) : (
                        <ul className="space-y-2">
                          {dayExhibitions.map((exhibition) => (
                            <li key={exhibition._id} className="text-sm">
                              <Link 
                                href={`/exhibition/${exhibition._id}`}
                                className="block p-2 rounded hover:bg-gray-100"
                              >
                                <div className="font-medium truncate" title={exhibition.title}>
                                  {exhibition.title}
                                </div>
                                <div className="text-gray-600 text-xs">
                                  {exhibition.location.name}
                                </div>
                                {exhibition.ticketPrice && (
                                  <div className="text-xs mt-1">
                                    {exhibition.ticketUrl ? (
                                      <span className="text-blue-600">
                                        {exhibition.ticketPrice} - Tickets available
                                      </span>
                                    ) : (
                                      <span>
                                        {exhibition.ticketPrice}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        <div className="text-center mb-8">
          <Link
            href="/date-search"
            className="text-rose-500 hover:underline"
          >
            Go to date search to plan a specific day
          </Link>
        </div>
      </main>
    </div>
  );
}