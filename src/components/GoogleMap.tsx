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
  center = { lat: 48.8566, lng: 2.3522 },
  zoom = 13, // Adjust default zoom if needed
  markers = [],
  mainMarker, // New prop
  isMainMarkerDraggable = false, // Default to not draggable
  onMainMarkerDragEnd,
  height = '500px',
  onClick, // New prop
  onDragEnd,
  showSearchBox = false,
  onPlaceSelected,
  polylines = [], // Default to empty array
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markerRefs = useRef<{ [key: string]: google.maps.Marker }>({});
  const mainMarkerRef = useRef<google.maps.Marker | null>(null); // Ref for the main marker
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  const polylineRefs = useRef<google.maps.Polyline[]>([]); // Ref to store map polyline objects

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
            infoWindowRef.current!.setContent(content);
            infoWindowRef.current!.open(map, marker);
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

  // Initialize the map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current || mapInstanceRef.current) return; // Prevent re-initialization

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry', 'geocoding'] // <<< Ensure all needed libs are here
    });

    try {
      const google = await loader.load();
      
      const mapOptions: google.maps.MapOptions = {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: false, // Usually less relevant for route maps
        fullscreenControl: true,
        zoomControl: true,
        styles: [
           // Optional: simplify map styles
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          },
          {
            featureType: 'transit',
            elementType: 'labels.icon',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      // Setup click handler - CALLS the onClick prop if provided
      if (onClick) {
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          const position = event.latLng;
          if (position && onClick) {
            onClick({ lat: position.lat(), lng: position.lng() });
          }
        });
      }

      // Setup drag end handler
      if (onDragEnd) {
        map.addListener('dragend', () => {
          const mapCenter = map.getCenter();
          if (mapCenter && onDragEnd) {
            onDragEnd({
              lat: mapCenter.lat(),
              lng: mapCenter.lng()
            });
          }
        });
      }

      // Initialize search box if needed
      if (showSearchBox && searchInputRef.current) {
        const searchBox = new google.maps.places.SearchBox(searchInputRef.current);
        searchBoxRef.current = searchBox;

        map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchInputRef.current);

        // Listen for the event fired when the user selects a prediction
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (places && places.length > 0) {
            // For each place, get the icon, name and location
            const bounds = new google.maps.LatLngBounds();
            places.forEach(place => {
              if (!place.geometry || !place.geometry.location) return;

              if (onPlaceSelected) {
                onPlaceSelected(place);
              }

              if (place.geometry.viewport) {
                // Only geocodes have viewport
                bounds.union(place.geometry.viewport);
              } else {
                bounds.extend(place.geometry.location);
              }
            });
            map.fitBounds(bounds);
          }
        });
      }

      // Draw initial standard markers, main marker, and polylines
      markers.forEach(markerData => addMarker(markerData, map));
      updateMainMarker(map); // Draw/update the main marker
      drawPolylines(map);

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  }, [apiKey, center, zoom, markers, onClick, onDragEnd, showSearchBox, onPlaceSelected, addMarker, updateMainMarker, drawPolylines]);

  // Update markers dynamically
  useEffect(() => {
    // Clear existing markers before adding new ones
    Object.values(markerRefs.current).forEach(marker => marker.setMap(null));
    markerRefs.current = {};
    // Add new markers
    markers.forEach(markerData => addMarker(markerData, mapInstanceRef.current));
  }, [markers, addMarker]); // Rerun only when markers array or addMarker changes

  // Update polylines dynamically
  useEffect(() => {
      drawPolylines(mapInstanceRef.current);
  }, [polylines, drawPolylines]); // Rerun only when polylines array or drawPolylines changes

  // Update main marker dynamically
  useEffect(() => {
      updateMainMarker(mapInstanceRef.current);
  }, [mainMarker, updateMainMarker]); // Rerun when mainMarker data changes

  // Initialize map on component mount
  useEffect(() => {
    initializeMap();
    // Cleanup function
    return () => {
      // Clear markers
      Object.values(markerRefs.current).forEach(marker => {
        marker.setMap(null);
      });
      markerRefs.current = {};
      // Clear polylines
      polylineRefs.current.forEach(p => p.setMap(null));
      polylineRefs.current = [];
      // Close info window
      infoWindowRef.current?.close();
      // Note: We don't nullify mapInstanceRef here as it might cause issues with fast refresh
      // Cleanup main marker
      mainMarkerRef.current?.setMap(null);
      mainMarkerRef.current = null;
    };
  }, [initializeMap]);

  return (
    <div className="relative w-full" style={{ height }}>
      {showSearchBox && (
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Søk etter sted..."
          className="absolute top-4 left-3 z-10 w-72 md:w-96 px-4 py-2 rounded-md border border-gray-300 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden bg-gray-200" />
      
      {/* Optional: Add a loading indicator or message if map isn't ready? */}
    </div>
  );
}