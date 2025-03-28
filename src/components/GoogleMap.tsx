// src/components/GoogleMap.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface GoogleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    id: string;
    position: { lat: number; lng: number };
    title: string;
    info?: string;
    link?: string;
  }>;
  height?: string;
  onClick?: (location: { lat: number; lng: number }) => void;
  onDragEnd?: (center: { lat: number; lng: number }) => void;
  showSearchBox?: boolean;
  onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
}

const GoogleMap = ({
  apiKey,
  center = { lat: 48.8566, lng: 2.3522 }, // Default to Paris
  zoom = 13,
  markers = [],
  height = '500px',
  onClick,
  onDragEnd,
  showSearchBox = false,
  onPlaceSelected
}: GoogleMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markerRefs = useRef<{ [key: string]: google.maps.Marker }>({});
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);
  
  // Initialize the map
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places']
    });

    try {
      const google = await loader.load();
      
      const mapOptions: google.maps.MapOptions = {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      };

      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      // Setup click handler
      if (onClick) {
        map.addListener('click', (event: google.maps.MapMouseEvent) => {
          const position = event.latLng;
          if (position && onClick) {
            onClick({
              lat: position.lat(),
              lng: position.lng()
            });
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

      // Add markers
      markers.forEach(marker => addMarker(marker, map));

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  }, [apiKey, center, zoom, markers, onClick, onDragEnd, showSearchBox, onPlaceSelected]);

  // Add a marker to the map
  const addMarker = (
    marker: {
      id: string;
      position: { lat: number; lng: number };
      title: string;
      info?: string;
      link?: string;
    },
    map: google.maps.Map
  ) => {
    if (!marker.position || !marker.id) return;

    const newMarker = new google.maps.Marker({
      position: marker.position,
      map,
      title: marker.title,
      animation: google.maps.Animation.DROP
    });

    // Store reference to marker
    markerRefs.current[marker.id] = newMarker;

    // Add click handler for the marker
    if (marker.info || marker.link) {
      newMarker.addListener('click', () => {
        if (!infoWindowRef.current) return;

        let content = `<div><h3 style="margin:0;padding:0;font-size:16px;">${marker.title}</h3>`;
        
        if (marker.info) {
          content += `<p style="margin:5px 0;">${marker.info}</p>`;
        }
        
        if (marker.link) {
          content += `<a href="${marker.link}" target="_blank" style="color:#e11d48;text-decoration:none;">View Details</a>`;
        }
        
        content += `</div>`;

        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(map, newMarker);
      });
    }
  };

  // Update markers when they change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear all existing markers
    Object.values(markerRefs.current).forEach(marker => {
      marker.setMap(null);
    });
    markerRefs.current = {};

    // Add new markers
    markers.forEach(marker => {
      addMarker(marker, mapInstanceRef.current!);
    });
  }, [markers]);

  // Initialize map on component mount
  useEffect(() => {
    initializeMap();

    // Cleanup
    return () => {
      // Clear all markers
      Object.values(markerRefs.current).forEach(marker => {
        marker.setMap(null);
      });
      markerRefs.current = {};
    };
  }, [initializeMap]);

  return (
    <div className="google-map-container" style={{ position: 'relative', width: '100%', height }}>
      {showSearchBox && (
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search for a location"
          className="map-search-box"
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1,
            width: '60%',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #ccc',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
          }}
        />
      )}
      <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default GoogleMap;