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
}

// Simplified props, as we no longer need week offsets
interface VerticalCalendarProps {}

export default function VerticalCalendar({}: VerticalCalendarProps) {
  const [displayDates, setDisplayDates] = useState<Date[]>([]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate dates for yesterday, today, and tomorrow
  useEffect(() => {
    const getDisplayDates = () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      
      return [yesterday, today, tomorrow];
    };

    const dates = getDisplayDates();
    setDisplayDates(dates);
    
    // Fetch exhibitions for this 3-day range
    fetchExhibitions(dates[0], dates[2]);
  }, []);
  
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
  
  // Helper to get exhibitions for a specific date
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

  const getRelativeDayName = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const diffTime = compareDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === -1) return "Yesterday";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    
    // Fallback for other dates, though not expected here
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="mb-4 pb-4 border-b border-gray-100 last:border-0">
            <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Around Today</h2>
      
      {displayDates.map((date, index) => {
        const dayExhibitions = getExhibitionsForDate(date);
        const relativeDayName = getRelativeDayName(date);
        const isCurrentDay = relativeDayName === "Today";
        
        return (
          <div 
            key={`day-${index}`} 
            className={`py-4 ${index < displayDates.length - 1 ? 'border-b border-gray-100' : ''} ${isCurrentDay ? 'bg-rose-50 -mx-6 px-6 rounded-md' : ''}`}
          >
            <div className={`font-bold mb-2 ${isCurrentDay ? 'text-rose-600' : 'text-gray-700'}`}>
              {relativeDayName}
              <span className="ml-2 text-sm font-normal text-gray-500">
                {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            {dayExhibitions.length === 0 ? (
              <p className="text-gray-400 text-sm italic">No exhibitions found</p>
            ) : (
              <ul className="space-y-3">
                {dayExhibitions.slice(0, 3).map((exhibition) => (
                  <li key={exhibition._id}>
                    <Link href={`/exhibition/${exhibition._id}`} className="flex items-center group">
                      <Image 
                        src={exhibition.coverImage || '/images/placeholder-exhibition.svg'} 
                        alt={exhibition.title} 
                        width={40} height={40} 
                        className="w-10 h-10 rounded-md object-cover mr-3" 
                      />
                      <div>
                        <div className="font-medium text-gray-800 text-sm group-hover:text-rose-600 transition-colors">{exhibition.title}</div>
                        <div className="text-xs text-gray-500">{exhibition.location?.name}, {exhibition.location?.city}</div>
                      </div>
                    </Link>
                  </li>
                ))}
                
                {dayExhibitions.length > 3 && (
                  <li className="text-xs text-rose-500 mt-2">
                    <Link href={`/calendar?date=${date.toISOString().split('T')[0]}`} className="hover:underline">
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
        <Link href="/calendar" className="text-rose-500 hover:underline font-medium">
          View Full Calendar
        </Link>
      </div>
    </div>
  );
}