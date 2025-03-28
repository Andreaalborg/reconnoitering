// src/app/day-planner/page.tsx
'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Link from 'next/link';
import Image from 'next/image';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import GoogleMap from '@/components/GoogleMap';
import { calculateTravelTime } from '@/services/routesService';
import { exportItineraryToCalendar } from '@/services/calendarExport';

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
  closedDay?: string;
}

interface ItineraryItem {
  id: string;
  type: 'exhibition' | 'transport' | 'break';
  exhibition?: Exhibition;
  startTime: string;
  endTime: string;
  transportMode?: 'WALK' | 'DRIVE' | 'TRANSIT' | 'BICYCLE';
  transportTime?: number; // in minutes
  transportDistance?: number; // in meters
  transportPolyline?: string; // encoded polyline for the route
  note?: string;
}

function DayPlannerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Today's date if not specified
  const today = new Date();
  
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
  const [showMap, setShowMap] = useState<boolean>(false);
  const [routeCalculating, setRouteCalculating] = useState<boolean>(false);
  
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
          transportMode: 'TRANSIT',
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
  
  const updateItineraryTimes = async () => {
    if (itinerary.length === 0) return;
    
    // Start with the first item at start time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    let currentTimeInMinutes = startHours * 60 + startMinutes;
    
    const updatedItinerary = [...itinerary];
    
    // Update times for each item
    for (let i = 0; i < updatedItinerary.length; i++) {
      const item = updatedItinerary[i];
      item.startTime = minutesToTimeString(currentTimeInMinutes);
      
      if (item.type === 'exhibition') {
        // Exhibition duration
        currentTimeInMinutes += visitDuration;
      } else if (item.type === 'transport') {
        // Transport duration - either use previously calculated time or default
        currentTimeInMinutes += item.transportTime || transportTime;
      } else if (item.type === 'break') {
        // Break duration (30 minutes by default)
        currentTimeInMinutes += 30;
      }
      
      item.endTime = minutesToTimeString(currentTimeInMinutes);
    }
    
    setItinerary(updatedItinerary);
  };
  
  // Calculate routes between all locations using Google Routes API
  const calculateRoutes = async () => {
    if (itinerary.length < 3) return; // Need at least 2 exhibitions with 1 transport
    
    setRouteCalculating(true);
    
    try {
      const updatedItinerary = [...itinerary];
      
      // Process each transport item
      for (let i = 0; i < updatedItinerary.length; i++) {
        const item = updatedItinerary[i];
        
        if (item.type === 'transport') {
          const prevItem = updatedItinerary[i-1];
          const nextItem = updatedItinerary[i+1];
          
          // Ensure the previous and next items are exhibitions with coordinates
          if (prevItem?.type === 'exhibition' && nextItem?.type === 'exhibition' &&
              prevItem.exhibition?.location.coordinates && nextItem.exhibition?.location.coordinates) {
            
            const origin = prevItem.exhibition.location.coordinates;
            const destination = nextItem.exhibition.location.coordinates;
            
            // Calculate travel time using Google Routes API
            const travelMinutes = await calculateTravelTime(
              { lat: origin.lat, lng: origin.lng },
              { lat: destination.lat, lng: destination.lng },
              item.transportMode
            );
            
            // Update transport item
            item.transportTime = travelMinutes;
            
            // Update end time
            const startTimeMinutes = timeStringToMinutes(item.startTime);
            const endTimeMinutes = startTimeMinutes + travelMinutes;
            item.endTime = minutesToTimeString(endTimeMinutes);
            
            // Update times for subsequent items
            let currentTimeInMinutes = endTimeMinutes;
            
            for (let j = i + 1; j < updatedItinerary.length; j++) {
              const nextItem = updatedItinerary[j];
              nextItem.startTime = minutesToTimeString(currentTimeInMinutes);
              
              if (nextItem.type === 'exhibition') {
                currentTimeInMinutes += visitDuration;
              } else if (nextItem.type === 'transport') {
                currentTimeInMinutes += nextItem.transportTime || transportTime;
              } else if (nextItem.type === 'break') {
                currentTimeInMinutes += 30;
              }
              
              nextItem.endTime = minutesToTimeString(currentTimeInMinutes);
            }
          }
        }
      }
      
      setItinerary(updatedItinerary);
      
    } catch (error) {
      console.error('Error calculating routes:', error);
      alert('Some routes could not be calculated accurately. Default travel times are used instead.');
    } finally {
      setRouteCalculating(false);
    }
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
  
  const updateTransportMode = (index: number, mode: 'WALK' | 'DRIVE' | 'TRANSIT' | 'BICYCLE') => {
    const newItinerary = [...itinerary];
    if (newItinerary[index].type === 'transport') {
      newItinerary[index].transportMode = mode;
      
      // Update transport time based on mode (these are just estimates before calculating)
      if (mode === 'WALK') {
        newItinerary[index].transportTime = 45; // 45 minutes for walking
      } else if (mode === 'TRANSIT') {
        newItinerary[index].transportTime = 30; // 30 minutes for public transport
      } else if (mode === 'DRIVE') {
        newItinerary[index].transportTime = 20; // 20 minutes for driving
      } else {
        newItinerary[index].transportTime = 35; // 35 minutes for bicycling
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
  
  // Export to calendar
  const handleExportToCalendar = () => {
    try {
      const dateObj = new Date(date);
      exportItineraryToCalendar(dateObj, itinerary);
    } catch (error) {
      console.error('Error exporting to calendar:', error);
      alert('Failed to create calendar file. Please try again.');
    }
  };
  
  // Print-friendly version
  const togglePrintVersion = () => {
    setShowPrintVersion(!showPrintVersion);
  };
  
  // Prepare map data
  const prepareMapData = () => {
    // Extract exhibition locations with coordinates
    const locationMarkers = itinerary
      .filter(item => item.type === 'exhibition' && item.exhibition?.location.coordinates)
      .map((item, index) => {
        const exhibition = item.exhibition!;
        return {
          id: exhibition._id,
          position: {
            lat: exhibition.location.coordinates!.lat,
            lng: exhibition.location.coordinates!.lng
          },
          title: exhibition.title,
          info: `${index + 1}. ${exhibition.title} (${item.startTime}-${item.endTime})`
        };
      });
    
    // Calculate the center of all locations
    if (locationMarkers.length > 0) {
      const sumLat = locationMarkers.reduce((sum, marker) => sum + marker.position.lat, 0);
      const sumLng = locationMarkers.reduce((sum, marker) => sum + marker.position.lng, 0);
      
      return {
        markers: locationMarkers,
        center: {
          lat: sumLat / locationMarkers.length,
          lng: sumLng / locationMarkers.length
        }
      };
    }
    
    return {
      markers: [],
      center: { lat: 48.8566, lng: 2.3522 } // Default to Paris
    };
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
  
  const mapData = prepareMapData();
  
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
                onClick={handleExportToCalendar}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
              >
                <span className="flex items-center">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-2" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                    />
                  </svg>
                  Export to Calendar
                </span>
              </button>
              
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
              
              <div className="flex items-end space-x-2">
                <button
                  onClick={addBreak}
                  className="bg-blue-100 text-blue-700 border border-blue-300 px-4 py-2 rounded hover:bg-blue-200 transition-colors"
                >
                  Add Break
                </button>
                
                <button
                  onClick={calculateRoutes}
                  disabled={routeCalculating}
                  className="bg-purple-100 text-purple-700 border border-purple-300 px-4 py-2 rounded hover:bg-purple-200 transition-colors disabled:opacity-50"
                >
                  {routeCalculating ? 'Calculating...' : 'Calculate Routes'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {!showPrintVersion && mapData.markers.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Route Map</h2>
              <button
                onClick={() => setShowMap(!showMap)}
                className="text-blue-500 hover:text-blue-700"
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </button>
            </div>
            
            {showMap && (
              <div className="h-96 rounded-lg overflow-hidden">
                <GoogleMap
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                  center={mapData.center}
                  zoom={12}
                  markers={mapData.markers}
                  height="384px"
                />
              </div>
            )}
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
                                            {item.exhibition?.location.address}, {item.exhibition?.location.city}
                                          </p>
                                          {item.exhibition?.closedDay && (
                                            <p className="text-amber-600 text-sm mt-1">
                                              Closed on {item.exhibition.closedDay}s
                                            </p>
                                          )}
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
                                          {item.transportMode === 'WALK' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7" />
                                            </svg>
                                          )}
                                          {item.transportMode === 'TRANSIT' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path d="M12 2c-4.42 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h12v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm5.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6h-5V6h5v5z" />
                                            </svg>
                                          )}
                                          {item.transportMode === 'DRIVE' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
                                            </svg>
                                          )}
                                          {item.transportMode === 'BICYCLE' && (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                              <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
                                            </svg>
                                          )}
                                        </div>
                                        
                                        {/* Transport info */}
                                        <div>
                                          <div className="font-medium">
                                            {item.transportMode === 'WALK' ? 'Walking' : 
                                             item.transportMode === 'TRANSIT' ? 'Public Transport' : 
                                             item.transportMode === 'DRIVE' ? 'Driving' :
                                             'Cycling'}
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
                                              onClick={() => updateTransportMode(index, 'WALK')}
                                              className={`px-3 py-1 text-sm rounded ${
                                                item.transportMode === 'WALK' 
                                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              Walk
                                            </button>
                                            <button
                                              onClick={() => updateTransportMode(index, 'TRANSIT')}
                                              className={`px-3 py-1 text-sm rounded ${
                                                item.transportMode === 'TRANSIT' 
                                                  ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              Public
                                            </button>
                                            <button
                                              onClick={() => updateTransportMode(index, 'DRIVE')}
                                              className={`px-3 py-1 text-sm rounded ${
                                                item.transportMode === 'DRIVE' 
                                                  ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              Drive
                                            </button>
                                            <button
                                              onClick={() => updateTransportMode(index, 'BICYCLE')}
                                              className={`px-3 py-1 text-sm rounded ${
                                                item.transportMode === 'BICYCLE' 
                                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
                                                  : 'bg-gray-100 text-gray-600 border border-gray-200'
                                              }`}
                                            >
                                              Cycle
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
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <DayPlannerContent />
    </Suspense>
  );
}