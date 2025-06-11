'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Exhibition {
  _id: string;
  title: string;
  location: {
    name: string;
    city: string;
  };
  coverImage: string;
  startDate: string;
  endDate: string;
  ticketPrice?: string;
  ticketUrl?: string;
}

interface VerticalCalendarProps {
  initialWeekOffset?: number; // 0 = current week, 1 = next week, -1 = previous week
}

export default function VerticalCalendar({ initialWeekOffset = 0 }: VerticalCalendarProps) {
  const [weekOffset, setWeekOffset] = useState(initialWeekOffset);
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Generate dates for the selected week
  useEffect(() => {
    const dates = getWeekDates(weekOffset);
    setWeekDates(dates);
    
    // Fetch exhibitions for this week
    fetchExhibitions(dates[0], dates[6]);
  }, [weekOffset]);
  
  // Helper function to get all dates in the week
  const getWeekDates = (weekOffset: number): Date[] => {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate the date of Monday (start of week)
    const monday = new Date(today);
    const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1; // Adjust for Sunday
    monday.setDate(today.getDate() - daysFromMonday + (weekOffset * 7));
    
    // Generate array of dates for the week
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      weekDates.push(date);
    }
    
    return weekDates;
  };
  
  // Fetch exhibitions for the given date range
  const fetchExhibitions = async (startDate: Date, endDate: Date) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('startDate', startDate.toISOString().split('T')[0]);
      params.set('endDate', endDate.toISOString().split('T')[0]);
      
      const response = await fetch(`/api/exhibitions?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setExhibitions(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to get exhibitions for a specific date
  const getExhibitionsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    return exhibitions.filter(exhibition => {
      const startDate = new Date(exhibition.startDate);
      const endDate = new Date(exhibition.endDate);
      
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];
      
      return dateString >= startDateString && dateString <= endDateString;
    });
  };
  
  // Format date for display
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
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
  
  if (loading && exhibitions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
            <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
        {[...Array(7)].map((_, index) => (
          <div key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  const startOfWeek = weekDates[0];
  const endOfWeek = weekDates[6];
  const formattedDateRange = `${startOfWeek?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek?.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">This Week's Events</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Previous week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Next week"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">{formattedDateRange}</div>
      
      {weekDates.map((date, index) => {
        const dayExhibitions = getExhibitionsForDate(date);
        const isCurrentDay = isToday(date);
        
        return (
          <div 
            key={`day-${index}`} 
            className={`mb-4 pb-4 border-b border-gray-100 last:border-0 ${isCurrentDay ? 'bg-rose-50 -mx-6 px-6 py-3 rounded-md' : ''}`}
          >
            <div className={`font-medium mb-2 ${isCurrentDay ? 'text-rose-600' : 'text-gray-700'}`}>
              {formatDate(date)} {isCurrentDay && <span className="ml-2 text-xs bg-rose-600 text-white px-2 py-0.5 rounded-full">Today</span>}
            </div>
            
            {dayExhibitions.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No exhibitions</p>
            ) : (
              <ul className="space-y-3">
                {dayExhibitions.slice(0, 3).map((exhibition) => (
                  <li key={exhibition._id} className="border-t border-gray-200">
                    <Link href={`/exhibition/${exhibition._id}`} className="flex items-center p-3 hover:bg-gray-50">
                      <Image src={exhibition.coverImage || '/images/placeholder-exhibition.svg'} alt={exhibition.title} width={48} height={48} className="w-12 h-12 rounded-md object-cover mr-4" />
                      <div>
                        <div className="font-medium text-gray-800">{exhibition.title}</div>
                        <div className="text-xs text-gray-500">{exhibition.location?.name}, {exhibition.location?.city}</div>
                      </div>
                    </Link>
                  </li>
                ))}
                
                {dayExhibitions.length > 3 && (
                  <li className="text-xs text-rose-500">
                    <Link href={`/calendar?date=${date.toISOString().split('T')[0]}`}>
                      +{dayExhibitions.length - 3} more exhibitions...
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>
        );
      })}
      
      <div className="mt-6 text-center">
        <Link href="/calendar" className="text-rose-500 hover:underline">
          View Full Calendar
        </Link>
      </div>
    </div>
  );
}