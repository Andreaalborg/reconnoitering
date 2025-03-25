'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Exhibition {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: string;
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
  websiteUrl?: string;
}

interface ItineraryItem {
  id: string;
  type: 'exhibition' | 'transport' | 'break';
  exhibition?: Exhibition;
  startTime: string;
  endTime: string;
  transportMode?: 'walking' | 'public' | 'taxi';
  transportTime?: number; // in minutes
  note?: string;
}

function DayPlannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Today's date if not specified
  const today = new Date();
  const currentYear = today.getFullYear();
  //const currentMonth = today.getMonth();
  
  // Get date from URL or use current
  const [date, setDate] = useState<string>(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryItem[]>([]);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [visitDuration, setVisitDuration] = useState<number>(60); // minutes
  const [transportTime, setTransportTime] = useState<number>(30); // minutes
  const [showPrintVersion, setShowPrintVersion] = useState<boolean>(false);
  
  useEffect(() => {
    const exhibitionIds = searchParams.get('exhibitions');
    
    if (!exhibitionIds) {
      setError('No exhibitions selected');
      setLoading(false);
      return;
    }
    
    fetchExhibitions(exhibitionIds.split(','));
  }, [searchParams]);
  
  const fetchExhibitions = async (ids: string[]) => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch each exhibition by ID
      const promises = ids.map(id => 
        fetch(`/api/exhibitions/${id}`).then(res => res.json())
      );
      
      const results = await Promise.all(promises);
      
      const fetchedExhibitions = results
        .filter(result => result.success)
        .map(result => result.data);
      
      setExhibitions(fetchedExhibitions);
      
      // Initialize itinerary after fetching exhibitions
      if (fetchedExhibitions.length > 0) {
        generateInitialItinerary(fetchedExhibitions);
      }
    } catch (err: any) {
      console.error('Error fetching exhibitions:', err);
      setError(err.message || 'Failed to load exhibitions');
    } finally {
      setLoading(false);
    }
  };
  
  const generateInitialItinerary = (exhibitions: Exhibition[]) => {
    // Start with empty itinerary
    const newItinerary: ItineraryItem[] = [];
    
    // Convert start time to minutes since midnight
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    let currentTimeInMinutes = startHours * 60 + startMinutes;
    
    // Add each exhibition with transport in between
    exhibitions.forEach((exhibition, index) => {
      // Calculate time strings
      const exhibitionStartTime = minutesToTimeString(currentTimeInMinutes);
      currentTimeInMinutes += visitDuration;
      const exhibitionEndTime = minutesToTimeString(currentTimeInMinutes);
      
      // Add exhibition to itinerary
      newItinerary.push({
        id: `exhibition-${exhibition._id}`,
        type: 'exhibition',
        exhibition,
        startTime: exhibitionStartTime,
        endTime: exhibitionEndTime
      });
      
      // Add transport to next exhibition if there is one
      if (index < exhibitions.length - 1) {
        const transportStartTime = exhibitionEndTime;
        currentTimeInMinutes += transportTime;
        const transportEndTime = minutesToTimeString(currentTimeInMinutes);
        
        newItinerary.push({
          id: `transport-${index}`,
          type: 'transport',
          startTime: transportStartTime,
          endTime: transportEndTime,
          transportMode: 'public',
          transportTime: transportTime
        });
      }
    });
    
    setItinerary(newItinerary);
  };
  
  const minutesToTimeString = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
  const timeStringToMinutes = (timeString: string): number => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };
  
  const updateItineraryTimes = () => {
    if (itinerary.length === 0) return;
    
    // Start with the first item at start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    let currentTimeInMinutes = startHours * 60 + startMinutes;
    
    const updatedItinerary = [...itinerary];
    
    // Update times for each item
    updatedItinerary.forEach((item, index) => {
      item.startTime = minutesToTimeString(currentTimeInMinutes);
      
      if (item.type === 'exhibition') {
        // Exhibition duration
        currentTimeInMinutes += visitDuration;
      } else if (item.type === 'transport') {
        // Transport duration
        currentTimeInMinutes += item.transportTime || transportTime;
      } else if (item.type === 'break') {
        // Break duration (30 minutes by default)
        currentTimeInMinutes += 30;
      }
      
      item.endTime = minutesToTimeString(currentTimeInMinutes);
    });
    
    setItinerary(updatedItinerary);
  };
  
  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }
    
    const items = Array.from(itinerary);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setItinerary(items);
    
    // Update times after reordering
    setTimeout(updateItineraryTimes, 100);
  };
  
  const addBreak = () => {
    // Find the last exhibition or transport
    const lastIndex = itinerary.length - 1;
    
    if (lastIndex >= 0) {
      const lastItem = itinerary[lastIndex];
      const breakStartTime = lastItem.endTime;
      
      // Calculate break end time (30 minutes later)
      const breakEndTimeMinutes = timeStringToMinutes(breakStartTime) + 30;
      const breakEndTime = minutesToTimeString(breakEndTimeMinutes);
      
      // Create new break item
      const newBreak: ItineraryItem = {
        id: `break-${Date.now()}`,
        type: 'break',
        startTime: breakStartTime,
        endTime: breakEndTime,
        note: 'Coffee break'
      };
      
      // Add to itinerary
      setItinerary([...itinerary, newBreak]);
      
      // Update all times
      setTimeout(updateItineraryTimes, 100);
    }
  };
  
  const removeItem = (index: number) => {
    const newItinerary = [...itinerary];
    newItinerary.splice(index, 1);
    setItinerary(newItinerary);
    
    // Update all times
    setTimeout(updateItineraryTimes, 100);
  };
  
  const updateItemTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    const newItinerary = [...itinerary];
    newItinerary[index][field] = value;
    setItinerary(newItinerary);
  };
  
  const updateTransportMode = (index: number, mode: 'walking' | 'public' | 'taxi') => {
    const newItinerary = [...itinerary];
    if (newItinerary[index].type === 'transport') {
      newItinerary[index].transportMode = mode;
      
      // Update transport time based on mode
      if (mode === 'walking') {
        newItinerary[index].transportTime = 45; // 45 minutes for walking
      } else if (mode === 'public') {
        newItinerary[index].transportTime = 30; // 30 minutes for public transport
      } else {
        newItinerary[index].transportTime = 20; // 20 minutes for taxi
      }
      
      setItinerary(newItinerary);
      
      // Update all times
      setTimeout(updateItineraryTimes, 100);
    }
  };
  
  const updateNote = (index: number, note: string) => {
    const newItinerary = [...itinerary];
    newItinerary[index].note = note;
    setItinerary(newItinerary);
  };
  
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Calculate total duration
  const calculateTotalDuration = () => {
    if (itinerary.length === 0) return '0h 0m';
    
    const firstItem = itinerary[0];
    const lastItem = itinerary[itinerary.length - 1];
    
    const startMinutes = timeStringToMinutes(firstItem.startTime);
    const endMinutes = timeStringToMinutes(lastItem.endTime);
    
    const totalMinutes = endMinutes - startMinutes;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  };
  
  // Print-friendly version
  const togglePrintVersion = () => {
    setShowPrintVersion(!showPrintVersion);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        </main>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
          <Link href="/date-search" className="text-rose-500 hover:underline">
            ← Go back to search
          </Link>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!showPrintVersion && <Header />}
      
      <main className={`max-w-7xl mx-auto ${showPrintVersion ? 'p-8' : 'px-4 sm:px-6 lg:px-8 py-8'}`}>
        {!showPrintVersion && (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Plan Your Day</h1>
              <p className="text-lg text-gray-600">
                {formatDateForDisplay(date)}
              </p>
            </div>
            
            <div className="flex space-x-4 mt-4 md:mt-0">
              <button 
                onClick={togglePrintVersion}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Print / Share
              </button>
              <Link
                href={`/date-search?date=${date}`}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
              >
                Back to Search
              </Link>
            </div>
          </div>
        )}
        
        {showPrintVersion && (
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 text-center">
              Day Plan: {formatDateForDisplay(date)}
            </h1>
            <div className="flex justify-center mt-4">
              <button 
                onClick={togglePrintVersion}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
              >
                Edit Plan
              </button>
              <button 
                onClick={() => window.print()}
                className="ml-4 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors print:hidden"
              >
                Print
              </button>
            </div>
          </div>
        )}
        
        {!showPrintVersion && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input 
                  type="time"
                  id="startTime"
                  value={startTime}
                  onChange={(e) => {
                    setStartTime(e.target.value);
                    setTimeout(updateItineraryTimes, 100);
                  }}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              
              <div>
                <label htmlFor="visitDuration" className="block text-sm font-medium text-gray-700 mb-1">
                  Visit Duration (minutes)
                </label>
                <input 
                  type="number"
                  id="visitDuration"
                  value={visitDuration}
                  onChange={(e) => {
                    setVisitDuration(parseInt(e.target.value));
                    setTimeout(updateItineraryTimes, 100);
                  }}
                  min="15"
                  max="180"
                  step="15"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              
              <div>
                <label htmlFor="transportTime" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Transport Time (minutes)
                </label>
                <input 
                  type="number"
                  id="transportTime"
                  value={transportTime}
                  onChange={(e) => {
                    setTransportTime(parseInt(e.target.value));
                    setTimeout(updateItineraryTimes, 100);
                  }}
                  min="5"
                  max="120"
                  step="5"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={addBreak}
                  className="bg-blue-100 text-blue-700 border border-blue-300 px-4 py-2 rounded hover:bg-blue-200 transition-colors w-full"
                >
                  Add Break
                </button>
              </div>
            </div>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-0 md:p-6">
          <div className={showPrintVersion ? "" : "overflow-x-auto"}>
            <div className="min-w-[768px]">
              {/* Timeline */}
              {itinerary.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="itinerary">
                    {(provided) => (
                      <div 
                        className="relative pl-14 py-4"
                        {...provided.droppableProps} 
                        ref={provided.innerRef}
                      >
                        {/* Timeline vertical line */}
                        <div className="absolute left-[28px] top-0 bottom-0 w-0.5 bg-gray-300"></div>
                        
                        {/* Items */}
                        {itinerary.map((item, index) => (
                          <Draggable 
                            key={item.id} 
                            draggableId={item.id} 
                            index={index}
                            isDragDisabled={showPrintVersion}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-8 relative"
                              >
                                {/* Timeline dot */}
                                <div 
                                  className={`absolute left-[21px] top-6 w-[14px] h-[14px] rounded-full transform -translate-y-1/2 z-10 ${
                                    item.type === 'exhibition' ? 'bg-blue-500' : 
                                    item.type === 'transport' ? 'bg-gray-400' : 
                                    'bg-green-500'
                                  }`}
                                ></div>
                                
                                {/* Route item */}
                                <div className={`ml-4 p-4 rounded-lg ${
                                  item.type === 'exhibition' ? 'bg-blue-50 border border-blue-200' :
                                  item.type === 'transport' ? 'bg-gray-50 border border-gray-200' :
                                  'bg-green-50 border border-green-200'
                                }`}>
                                  {/* Header with time */}
                                  <div className="flex justify-between items-center mb-2">
                                    <div className="font-medium">
                                      {item.startTime} - {item.endTime}
                                    </div>
                                    {!showPrintVersion && (
                                      <div className="flex space-x-2">
                                        {/* Remove button */}
                                        <button
                                          type="button"
                                          onClick={() => removeItem(index)}
                                          className="text-red-400 hover:text-red-600"
                                        >
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Content */}
                                  {item.type === 'exhibition' && (
                                    <div>
                                      <div className="flex items-start">
                                        {item.exhibition?.coverImage && (
                                          <div className="flex-shrink-0 mr-4">
                                            <div className="h-16 w-16 relative rounded overflow-hidden">
                                              <Image 
                                                src={item.exhibition.coverImage} 
                                                alt={item.exhibition.title}
                                                fill
                                                className="object-cover"
                                              />
                                            </div>
                                          </div>
                                        )}
                                        <div>
                                          <h3 className="font-semibold text-lg">{item.exhibition?.title}</h3>
                                          <p className="text-gray-600">{item.exhibition?.location.name}</p>
                                          <p className="text-sm text-gray-500">
                                            {item.exhibition?.location.city}, {item.exhibition?.location.country}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {!showPrintVersion && (
                                        <div className="mt-3 border-t border-blue-100 pt-3">
                                          <input
                                            type="text"
                                            value={item.note || ''}
                                            onChange={(e) => updateNote(index, e.target.value)}
                                            placeholder="Add notes about this visit..."
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                          />
                                        </div>
                                      )}
                                      
                                      {showPrintVersion && item.note && (
                                        <div className="mt-3 border-t border-blue-100 pt-3">
                                          <p className="text-gray-700">{item.note}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {item.type === 'transport' && (
                                    <div>
                                      <div className="flex items-center text-gray-700">
                                        {/* Icon based on transport mode */}
                                        <div className="mr-3">
                                          {item.transportMode === 'walking' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                                            </svg>
                                          )}
                                          {item.transportMode === 'public' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                            </svg>
                                          )}
                                          {item.transportMode === 'taxi' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                            </svg>
                                          )}
                                        </div>
                                        
                                        {/* Transport info */}
                                        <div>
                                          <div className="font-medium">
                                            {item.transportMode === 'walking' ? 'Walking' : 
                                             item.transportMode === 'public' ? 'Public Transport' : 
                                             'Taxi'}
                                          </div>
                                          <div className="text-sm">
                                            Travel time: {item.transportTime} minutes
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {!showPrintVersion && (
                                        <div className="mt-3 flex justify-between">
                                          <div className="flex space-x-2">
                                            <button
                                              onClick={() => updateTransportMode(index, 'walking')}
                                              className={`px-3 py-1 text-sm rounded ${
                                                item.transportMode === 'walking' 
                                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              Walk
                                            </button>
                                            <button
                                              onClick={() => updateTransportMode(index, 'public')}
                                              className={`px-3 py-1 text-sm rounded ${
                                                item.transportMode === 'public' 
                                                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              Public
                                            </button>
                                            <button
                                              onClick={() => updateTransportMode(index, 'taxi')}
                                              className={`px-3 py-1 text-sm rounded ${
                                                item.transportMode === 'taxi' 
                                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              Taxi
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {item.type === 'break' && (
                                    <div>
                                      <div className="flex items-center">
                                        <div className="mr-3">
                                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                          </svg>
                                        </div>
                                        <div>
                                          <div className="font-medium">Break</div>
                                          <div className="text-sm text-gray-600">Duration: 30 minutes</div>
                                        </div>
                                      </div>
                                      
                                      {!showPrintVersion && (
                                        <div className="mt-3 border-t border-green-100 pt-3">
                                          <input
                                            type="text"
                                            value={item.note || 'Coffee break'}
                                            onChange={(e) => updateNote(index, e.target.value)}
                                            placeholder="What's this break for..."
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                          />
                                        </div>
                                      )}
                                      
                                      {showPrintVersion && item.note && (
                                        <div className="mt-3 border-t border-green-100 pt-3">
                                          <p className="text-gray-700">{item.note}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No exhibitions in your itinerary yet.</p>
                  <Link
                    href={`/date-search?date=${date}`}
                    className="mt-4 inline-block text-rose-500 hover:underline"
                  >
                    Go back to search and select exhibitions
                  </Link>
                </div>
              )}
            </div>
          </div>
          
          {itinerary.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center text-gray-600">
              <div>
                <span className="font-medium">Total duration:</span> {calculateTotalDuration()}
              </div>
              
              <div>
                <span className="font-medium">Exhibitions:</span> {itinerary.filter(item => item.type === 'exhibition').length}
              </div>
              
              {!showPrintVersion && (
                <button
                  onClick={updateItineraryTimes}
                  className="mt-4 md:mt-0 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 transition-colors"
                >
                  Recalculate Times
                </button>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DayPlannerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
        <DayPlannerContent />
      </Suspense>
    </div>
  );
}