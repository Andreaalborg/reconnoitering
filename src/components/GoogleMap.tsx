// src/components/GoogleMap.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import Link from 'next/link';
// Polyline decoding is part of the geometry library, loaded via Loader

interface Exhibition {
 // ... (keep existing Exhibition interface if needed, or remove if not used here)
}

interface MapMarker {
    id: string;
    position: { lat: number; lng: number };
    title: string;
    info?: string;
    link?: string; // Keep link if you use it in info window
}

interface GoogleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: MapMarker[]; // Use the defined MapMarker interface
  mainMarker?: MapMarker; // Add prop for a single, primary marker (e.g., for editing)
  isMainMarkerDraggable?: boolean;
  onMainMarkerDragEnd?: (location: { lat: number; lng: number }) => void;
  height?: string;
  onClick?: (location: { lat: number; lng: number }) => void;
  onDragEnd?: (center: { lat: number; lng: number }) => void;
  showSearchBox?: boolean;
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
  polylines?: string[]; // Add polylines prop (array of encoded strings)
}

export default function GoogleMap({ 
  apiKey,
  center = { lat: 59.9139, lng: 10.7522 }, // Default center Oslo
  zoom = 13,
  markers = [],
  mainMarker,
  isMainMarkerDraggable = false,
  onMainMarkerDragEnd,
  height = '500px',
  onClick,
  onDragEnd,
  showSearchBox = false,
  onPlaceSelected,
  polylines = [],
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markerRefs = useRef<{ [key: string]: google.maps.Marker }>({});
  const mainMarkerRef = useRef<google.maps.Marker | null>(null);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const polylineRefs = useRef<google.maps.Polyline[]>([]);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null); // Ny ref for Autocomplete widget

  // Function to draw polylines
  const drawPolylines = useCallback((map: google.maps.Map | null) => {
    if (!map) return;
    // Clear existing polylines first
    polylineRefs.current.forEach(p => p.setMap(null));
    polylineRefs.current = [];

    if (google.maps.geometry && google.maps.geometry.encoding) {
        polylines.forEach((encodedPolyline, index) => {
            try {
                const decodedPath = google.maps.geometry.encoding.decodePath(encodedPolyline);
                
                const routePolyline = new google.maps.Polyline({
                path: decodedPath,
                geodesic: true,
                strokeColor: '#4285F4', // Google Blue
                strokeOpacity: 0.8,
                strokeWeight: 4,
                map: map,
                });
                polylineRefs.current.push(routePolyline);
            } catch (e) {
                console.error(`Error decoding or drawing polyline ${index}:`, e);
            }
        });
    } else {
        console.warn("Google Maps geometry library not available for polyline drawing.");
    }
  }, [polylines]);

  // Function to add standard markers (unchanged)
  const addMarker = useCallback((markerData: MapMarker, map: google.maps.Map | null) => {
    if (!map || !markerData.position || !markerData.id) return;

    const marker = new google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
        label: markerData.info?.startsWith('1.') ? '1' : undefined, // Basic label for first stop?
        animation: google.maps.Animation.DROP
    });

    markerRefs.current[markerData.id] = marker;

    if ((markerData.info || markerData.link) && infoWindowRef.current) {
        const content = document.createElement('div');
        content.className = 'p-2';
        content.innerHTML = `
            <h3 class="font-bold text-sm mb-1">${markerData.title}</h3>
            ${markerData.info ? `<p class="text-xs mb-1">${markerData.info}</p>` : ''}
            ${markerData.link ? `<a href="${markerData.link}" target="_blank" class="text-rose-500 text-xs hover:underline">View Details</a>` : ''}
        `;

        marker.addListener('click', () => {
            if (infoWindowRef.current) { // Check if infoWindowRef.current exists
                infoWindowRef.current.setContent(content);
                infoWindowRef.current.open(map, marker);
            }
        });
    }
  }, []); // Removed infoWindowRef from dependencies as it's stable after init

  // Function to create or update the main, single marker
  const updateMainMarker = useCallback((map: google.maps.Map | null) => {
      if (!map) return;
      // Remove existing main marker first
      mainMarkerRef.current?.setMap(null);
      mainMarkerRef.current = null;

      if (mainMarker?.position) {
          const marker = new google.maps.Marker({
              position: mainMarker.position,
              map,
              title: mainMarker.title || 'Selected Location',
              draggable: isMainMarkerDraggable,
              icon: {
                  url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // Distinct icon
                  scaledSize: new google.maps.Size(40, 40)
              }
          });
          mainMarkerRef.current = marker;

          // Add drag end listener if draggable and callback exists
          if (isMainMarkerDraggable && onMainMarkerDragEnd) {
              marker.addListener('dragend', (event: google.maps.MapMouseEvent) => {
                  const pos = event.latLng;
                  if (pos) {
                    onMainMarkerDragEnd({ lat: pos.lat(), lng: pos.lng() });
                  }
              });
          }
          // Optional: Open info window for main marker?
          // if (mainMarker.info && infoWindowRef.current) { ... }
      }
  }, [mainMarker, isMainMarkerDraggable, onMainMarkerDragEnd]);

  // Initialize map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return; // Exit if no div or map already exists

    try {
      const loader = new Loader({
        apiKey,
        version: 'weekly',
        libraries: ['places', 'geometry', 'geocoding'] // Added geocoding back for consistency
      });

      const google = await loader.load();
      console.log("Google Maps API loaded.");
      
      // --- Initialize map --- 
      if (!mapRef.current) {
        console.error("mapRef.current became null before map initialization!");
        return; 
      }
      
      // Add another check right before instantiation
      if (!mapRef.current) {
        console.error("mapRef.current became null JUST before new google.maps.Map()!");
        return;
      }

      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });
      mapInstanceRef.current = map;
      
      // Initialize InfoWindow once
      infoWindowRef.current = new google.maps.InfoWindow();

      // --- Setup Autocomplete Search Box (New approach) --- 
      if (showSearchBox && searchInputRef.current && onPlaceSelected) {
        const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
            fields: ["place_id", "geometry", "name", "formatted_address", "address_components", "website"], // Lagt til address_components og website
            // types: ['geocode', 'establishment'], // Midlertidig fjernet for testing
            // componentRestrictions: { country: "no" }, // Midlertidig fjernet for testing
        });
        autocompleteRef.current = autocomplete;
        
        autocomplete.bindTo("bounds", map);

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          console.log("[GoogleMap.tsx] Place changed event fired. Place:", place); // Ny logg

          // Kall onPlaceSelected uansett for debugging, men sjekk om den eksisterer
          if (onPlaceSelected) {
            onPlaceSelected(place);
          }

          if (place.geometry && place.geometry.location) {
              console.log("[GoogleMap.tsx] Place has geometry.");
              map.setCenter(place.geometry.location);
              map.setZoom(15); 
          } else {
              console.warn("[GoogleMap.tsx] Autocomplete place selected WITHOUT geometry. Place name:", place.name);
          }
        });
      }

      // --- Add Listeners --- 
      if (onClick) {
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            onClick({ lat: e.latLng.lat(), lng: e.latLng.lng() });
          }
        });
      }
      if (onDragEnd) {
        map.addListener('dragend', () => {
          const centerPos = map.getCenter();
          if (centerPos) {
            onDragEnd({ lat: centerPos.lat(), lng: centerPos.lng() });
          }
        });
      }

      // --- Initial drawing --- 
      drawPolylines(map);
      markers.forEach(marker => addMarker(marker, map));
      if (mainMarker) {
        updateMainMarker(map);
      }

    } catch (error) {
      console.error('Error initializing map:', error);
    }
  // Update dependencies: remove outdated refs, keep necessary state/props
  }, [apiKey, center, zoom, onClick, onDragEnd, showSearchBox, onPlaceSelected, drawPolylines, addMarker, updateMainMarker, mainMarker, markers]); // Added marker/mainMarker to re-init if they change drastically at start?

  // Update markers dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return; // Ensure map exists
    Object.values(markerRefs.current).forEach(marker => marker.setMap(null));
    markerRefs.current = {};
    markers.forEach(markerData => addMarker(markerData, mapInstanceRef.current));
  }, [markers, addMarker]);

  // Update polylines dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;
      drawPolylines(mapInstanceRef.current);
  }, [polylines, drawPolylines]);

  // Update main marker dynamically
  useEffect(() => {
    if (!mapInstanceRef.current) return;
      updateMainMarker(mapInstanceRef.current);
  }, [mainMarker, updateMainMarker]);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapInstanceRef.current) { // Only initialize if map doesn't exist yet
        initializeMap();
    }
    // Cleanup function
    return () => {
      // Cleanup function to remove listeners
      if (window.google && window.google.maps && window.google.maps.event) {
          autocompleteRef.current?.unbind("bounds"); // Unbind autocomplete
          if (autocompleteRef.current) {
            google.maps.event.clearInstanceListeners(autocompleteRef.current); // Clear listeners
          }
          if (mapInstanceRef.current) {
            google.maps.event.clearInstanceListeners(mapInstanceRef.current); // Clear map listeners
          }
      } else {
          console.warn("Google Maps API not fully available during cleanup, skipping listener removal.");
      }
      
      Object.values(markerRefs.current).forEach(marker => marker.setMap(null));
      markerRefs.current = {};
      polylineRefs.current.forEach(p => p.setMap(null));
      polylineRefs.current = [];
      mainMarkerRef.current?.setMap(null);
      mainMarkerRef.current = null;
      infoWindowRef.current?.close();
    };
  }, [initializeMap]); // Run only when initializeMap function reference changes

  // Re-center map when center prop changes EXTERNALLY (e.g., from parent page)
  useEffect(() => {
    if (mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter(center);
    }
  }, [center]); // Depend only on the center prop

  return (
    <div className="relative" style={{ height }}>
      {showSearchBox && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-full max-w-md px-4">
          <input
            ref={searchInputRef} // Use the ref for the Autocomplete widget
            type="text"
            placeholder="Search for a place or address..."
            className="w-full p-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg" />
    </div>
  );
}