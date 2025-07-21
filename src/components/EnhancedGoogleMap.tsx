// src/components/EnhancedGoogleMap.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface Exhibition {
  _id: string;
  title: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
}

interface EnhancedMapMarker {
  id: string;
  position: { lat: number; lng: number };
  title: string;
  address?: string;
  city: string;
  country: string;
  websiteUrl?: string;
  defaultClosedDays?: string[];
  currentExhibitions?: Exhibition[];
  exhibitionCount?: number;
}

interface EnhancedGoogleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: EnhancedMapMarker[];
  userPosition?: { lat: number; lng: number };
  selectedLocation?: { lat: number; lng: number } | null;
  searchedLocation?: { lat: number; lng: number } | null;
  showRadius?: boolean;
  radiusKm?: number;
  height?: string;
  showSearchBox?: boolean;
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  onMarkerClick?: (markerId: string) => void;
  onClick?: (location: { lat: number; lng: number }) => void;
}

export default function EnhancedGoogleMap({ 
  apiKey,
  center = { lat: 59.9139, lng: 10.7522 },
  zoom = 13,
  markers = [],
  userPosition,
  selectedLocation,
  searchedLocation,
  showRadius = false,
  radiusKm = 5,
  height = '500px',
  showSearchBox = false,
  onPlaceSelected,
  onMarkerClick,
  onClick,
}: EnhancedGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markerRefs = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const selectedLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const searchLocationMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Helper function to get the day name
  const getDayName = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  // Helper function to check if venue is closed today
  const isClosedToday = (closedDays: string[] = []): boolean => {
    const today = getDayName();
    return closedDays.includes(today);
  };

  // Helper function to format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Create custom marker content
  const createMarkerContent = (venue: EnhancedMapMarker) => {
    const markerDiv = document.createElement('div');
    markerDiv.className = 'custom-marker';
    
    const hasExhibitions = venue.exhibitionCount && venue.exhibitionCount > 0;
    const isClosed = isClosedToday(venue.defaultClosedDays);
    
    // Create pin icon with exhibition count
    markerDiv.innerHTML = `
      <div class="marker-pin ${hasExhibitions ? 'has-exhibitions' : 'no-exhibitions'} ${isClosed ? 'closed' : ''}">
        <svg width="40" height="48" viewBox="0 0 40 48" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 0C8.95 0 0 8.95 0 20C0 35 20 48 20 48S40 35 40 20C40 8.95 31.05 0 20 0Z" 
                fill="${hasExhibitions ? '#e11d48' : '#6b7280'}" 
                fill-opacity="${isClosed ? '0.6' : '1'}"/>
          <circle cx="20" cy="20" r="16" fill="white"/>
          <text x="20" y="26" text-anchor="middle" font-size="16" font-weight="bold" fill="${hasExhibitions ? '#e11d48' : '#6b7280'}">
            ${venue.exhibitionCount || '0'}
          </text>
        </svg>
        ${isClosed ? '<span class="closed-indicator">CLOSED</span>' : ''}
      </div>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .custom-marker {
        cursor: pointer;
        position: relative;
      }
      .marker-pin {
        position: relative;
        transition: transform 0.2s ease;
      }
      .marker-pin:hover {
        transform: scale(1.1);
      }
      .marker-pin.closed {
        opacity: 0.7;
      }
      .closed-indicator {
        position: absolute;
        top: -10px;
        left: 50%;
        transform: translateX(-50%);
        background: #dc2626;
        color: white;
        font-size: 9px;
        padding: 2px 4px;
        border-radius: 2px;
        font-weight: bold;
        white-space: nowrap;
      }
      .marker-tooltip {
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        background: white;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 16px;
        min-width: 320px;
        max-width: 400px;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        pointer-events: none;
      }
      .custom-marker:hover .marker-tooltip {
        opacity: 1;
        visibility: visible;
        transition-delay: 0.2s;
        pointer-events: auto;
      }
      .tooltip-header {
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 8px;
        margin-bottom: 8px;
      }
      .tooltip-title {
        font-size: 16px;
        font-weight: 600;
        color: #111827;
        margin: 0 0 4px 0;
      }
      .tooltip-location {
        font-size: 13px;
        color: #6b7280;
      }
      .tooltip-closed {
        display: inline-block;
        background: #fef2f2;
        color: #dc2626;
        font-size: 11px;
        padding: 2px 6px;
        border-radius: 4px;
        margin-top: 4px;
        font-weight: 500;
      }
      .tooltip-exhibitions {
        margin-top: 8px;
      }
      .exhibition-item {
        display: flex;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;
      }
      .exhibition-item:last-child {
        border-bottom: none;
      }
      .exhibition-image {
        width: 60px;
        height: 60px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
        background: #f3f4f6;
      }
      .exhibition-info {
        flex: 1;
        min-width: 0;
      }
      .exhibition-title {
        font-size: 14px;
        font-weight: 500;
        color: #111827;
        margin: 0 0 2px 0;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .exhibition-dates {
        font-size: 12px;
        color: #6b7280;
      }
      .no-exhibitions {
        font-size: 13px;
        color: #9ca3af;
        font-style: italic;
        padding: 8px 0;
      }
      .view-details {
        display: inline-block;
        margin-top: 12px;
        color: #e11d48;
        font-size: 13px;
        font-weight: 500;
        text-decoration: none;
      }
      .view-details:hover {
        text-decoration: underline;
      }
    `;
    document.head.appendChild(style);

    // Create tooltip content
    const tooltip = document.createElement('div');
    tooltip.className = 'marker-tooltip';
    
    let tooltipHTML = `
      <div class="tooltip-header">
        <h3 class="tooltip-title">${venue.title}</h3>
        <div class="tooltip-location">${venue.address || ''} ${venue.city}, ${venue.country}</div>
        ${isClosed ? `<span class="tooltip-closed">Closed today (${getDayName()})</span>` : ''}
      </div>
    `;

    if (venue.currentExhibitions && venue.currentExhibitions.length > 0) {
      tooltipHTML += '<div class="tooltip-exhibitions">';
      venue.currentExhibitions.slice(0, 5).forEach(exhibition => {
        const imageHtml = exhibition.imageUrl 
          ? `<img src="${exhibition.imageUrl}" alt="${exhibition.title}" class="exhibition-image" onerror="this.style.display='none'">`
          : '<div class="exhibition-image" style="background: #e5e7eb;"></div>';
          
        tooltipHTML += `
          <div class="exhibition-item">
            ${imageHtml}
            <div class="exhibition-info">
              <h4 class="exhibition-title">${exhibition.title}</h4>
              <div class="exhibition-dates">${formatDate(exhibition.startDate)} - ${formatDate(exhibition.endDate)}</div>
            </div>
          </div>
        `;
      });
      if (venue.currentExhibitions.length > 5) {
        tooltipHTML += `<div style="text-align: center; padding: 8px 0; font-size: 13px; color: #6b7280;"><em>+${venue.currentExhibitions.length - 5} more exhibitions</em></div>`;
      }
      tooltipHTML += '</div>';
    } else {
      tooltipHTML += '<div class="no-exhibitions">No current exhibitions</div>';
    }

    tooltipHTML += `<a href="/venues/${venue.id}" class="view-details">View details →</a>`;
    
    tooltip.innerHTML = tooltipHTML;
    markerDiv.appendChild(tooltip);

    return markerDiv;
  };

  // Function to add enhanced markers
  const addEnhancedMarker = useCallback(async (markerData: EnhancedMapMarker, map: google.maps.Map | null) => {
    if (!map || !markerData.position || !markerData.id) return;
    if (!google.maps.marker?.AdvancedMarkerElement) {
      console.warn('AdvancedMarkerElement not available');
      return;
    }

    const content = createMarkerContent(markerData);
    
    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: markerData.position,
      content: content,
    });

    markerRefs.current[markerData.id] = marker;

    // Add click listener
    content.addEventListener('click', () => {
      if (onMarkerClick) {
        onMarkerClick(markerData.id);
      }
    });
  }, [onMarkerClick]);

  // Function to update user marker
  const updateUserMarker = useCallback(async (map: google.maps.Map | null) => {
    if (!map) return;
    
    userMarkerRef.current?.map && (userMarkerRef.current.map = null);
    userMarkerRef.current = null;

    if (userPosition && google.maps.marker?.AdvancedMarkerElement) {
      const userContent = document.createElement('div');
      userContent.innerHTML = `
        <div style="
          width: 16px;
          height: 16px;
          background: #4285F4;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `;

      userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: userPosition,
        content: userContent,
        zIndex: 1000,
      });
    }
  }, [userPosition]);

  // Function to update search location marker
  const updateSearchLocationMarker = useCallback(async (map: google.maps.Map | null, location: { lat: number; lng: number } | null) => {
    if (!map) return;
    
    // Clear existing search location marker
    if (searchLocationMarkerRef.current?.map) {
      searchLocationMarkerRef.current.map = null;
    }
    searchLocationMarkerRef.current = null;

    if (location && google.maps.marker?.AdvancedMarkerElement) {
      // Create search location marker
      const searchContent = document.createElement('div');
      searchContent.innerHTML = `
        <div style="
          width: 24px;
          height: 24px;
          background: #10b981;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -35px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            font-weight: 500;
          ">Search Result</div>
        </div>
      `;

      searchLocationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: location,
        content: searchContent,
        zIndex: 998,
      });
    }
  }, []);

  // Function to update selected location marker and radius circle
  const updateSelectedLocation = useCallback(async (map: google.maps.Map | null) => {
    if (!map) return;
    
    // Clear existing selected location marker
    if (selectedLocationMarkerRef.current?.map) {
      selectedLocationMarkerRef.current.map = null;
    }
    selectedLocationMarkerRef.current = null;
    
    // Clear existing radius circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
    }
    radiusCircleRef.current = null;

    if (selectedLocation && google.maps.marker?.AdvancedMarkerElement) {
      // Create selected location marker
      const selectedContent = document.createElement('div');
      selectedContent.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: #ef4444;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          position: relative;
        ">
          <div style="
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            font-weight: 500;
          ">Selected Location</div>
        </div>
      `;

      selectedLocationMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: selectedLocation,
        content: selectedContent,
        zIndex: 999,
      });

      // Draw radius circle if enabled
      if (showRadius) {
        radiusCircleRef.current = new google.maps.Circle({
          map,
          center: selectedLocation,
          radius: radiusKm * 1000, // Convert km to meters
          fillColor: '#ef4444',
          fillOpacity: 0.1,
          strokeColor: '#ef4444',
          strokeOpacity: 0.4,
          strokeWeight: 2,
        });
      }
    }
  }, [selectedLocation, showRadius, radiusKm]);

  // Initialize map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return;

    try {
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'marker'],
        mapIds: ['DEMO_MAP_ID'] // Required for AdvancedMarkerElement
      });

      await loader.load();
      
      if (!mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapId: 'DEMO_MAP_ID',
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        clickableIcons: false, // Disable POI clicks to avoid conflicts
      });
      mapInstanceRef.current = map;
      
      infoWindowRef.current = new google.maps.InfoWindow();

      // Setup search box with Autocomplete (if available for existing users)
      if (showSearchBox && searchContainerRef.current && onPlaceSelected) {
        // Create input element
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Search for a place or address...';
        searchInput.className = 'w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500';
        
        searchInputRef.current = searchInput;
        searchContainerRef.current.appendChild(searchInput);
        
        try {
          // Try to use Autocomplete (works for existing API users)
          const autocomplete = new google.maps.places.Autocomplete(searchInput, {
            fields: ['place_id', 'geometry', 'name', 'formatted_address'],
          });
          
          autocompleteRef.current = autocomplete;
          autocomplete.bindTo('bounds', map);
          
          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            console.log('Place selected:', place);
            
            if (place.geometry?.location) {
              const location = {
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng()
              };
              
              // Add search location marker
              updateSearchLocationMarker(map, location);
              
              if (onPlaceSelected) {
                onPlaceSelected(place);
              }
              
              map.setCenter(location);
              map.setZoom(15);
            }
          });
          
        } catch (error) {
          console.warn('Autocomplete not available, falling back to geocoding:', error);
          
          // Fallback to geocoding on enter
          searchInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
              const query = (e.target as HTMLInputElement).value;
              if (!query) return;
              
              const geocoder = new google.maps.Geocoder();
              geocoder.geocode({ address: query }, (results, status) => {
                if (status === 'OK' && results && results[0]) {
                  const result = results[0];
                  const location = result.geometry.location;
                  const locationObj = {
                    lat: location.lat(),
                    lng: location.lng()
                  };
                  
                  // Add search location marker
                  updateSearchLocationMarker(map, locationObj);
                  
                  const placeResult: google.maps.places.PlaceResult = {
                    geometry: { location: location },
                    name: query,
                    formatted_address: result.formatted_address,
                  };
                  
                  if (onPlaceSelected) {
                    onPlaceSelected(placeResult);
                  }
                  
                  map.setCenter(location);
                  map.setZoom(15);
                } else {
                  console.error('Geocode failed:', status);
                  alert('Could not find location. Please try a different search term.');
                }
              });
            }
          });
        }
      }

      // Add click listener with timeout to avoid double-click conflicts
      let clickTimeout: NodeJS.Timeout | null = null;
      
      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (clickTimeout) clearTimeout(clickTimeout);
        
        clickTimeout = setTimeout(() => {
          console.log('Map clicked - raw event:', e);
          if (e.latLng && onClick) {
            const clickLocation = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            console.log('Map clicked at location:', clickLocation);
            onClick(clickLocation);
          }
        }, 200); // 200ms delay to differentiate from double-click
      });
      
      // Clear timeout on double-click
      map.addListener('dblclick', () => {
        if (clickTimeout) {
          clearTimeout(clickTimeout);
          clickTimeout = null;
        }
      });

      // Add markers
      for (const marker of markers) {
        await addEnhancedMarker(marker, map);
      }
      await updateUserMarker(map);
      await updateSelectedLocation(map);

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [apiKey, center, zoom, showSearchBox, onPlaceSelected, markers, addEnhancedMarker, updateUserMarker, updateSelectedLocation, updateSearchLocationMarker, onClick]);

  // Update markers when data changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // Clear existing markers
    Object.values(markerRefs.current).forEach(marker => {
      if (marker.map) marker.map = null;
    });
    markerRefs.current = {};

    // Add new markers
    markers.forEach(markerData => {
      addEnhancedMarker(markerData, mapInstanceRef.current);
    });
  }, [markers, addEnhancedMarker]);

  // Update user position marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updateUserMarker(mapInstanceRef.current);
  }, [userPosition, updateUserMarker]);

  // Update selected location marker and radius
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updateSelectedLocation(mapInstanceRef.current);
  }, [selectedLocation, showRadius, radiusKm, updateSelectedLocation]);

  // Update search location marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    updateSearchLocationMarker(mapInstanceRef.current, searchedLocation);
  }, [searchedLocation, updateSearchLocationMarker]);

  // Initialize map on mount
  useEffect(() => {
    if (!mapInstanceRef.current) {
      initializeMap();
    }
    
    return () => {
      if (autocompleteRef.current && window.google?.maps?.event) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
      if (mapInstanceRef.current && window.google?.maps?.event) {
        google.maps.event.clearInstanceListeners(mapInstanceRef.current);
      }
      
      Object.values(markerRefs.current).forEach(marker => {
        if (marker.map) marker.map = null;
      });
      markerRefs.current = {};
      
      if (userMarkerRef.current?.map) {
        userMarkerRef.current.map = null;
      }
      userMarkerRef.current = null;
      
      if (searchLocationMarkerRef.current?.map) {
        searchLocationMarkerRef.current.map = null;
      }
      searchLocationMarkerRef.current = null;
      
      infoWindowRef.current?.close();
    };
  }, [initializeMap]);

  // Re-center map when center changes
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]);

  return (
    <div className="relative" style={{ height }}>
      {showSearchBox && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
          <div ref={searchContainerRef} className="w-full">
            {/* PlaceAutocompleteElement will be inserted here */}
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}