'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import Link from 'next/link';

interface Exhibition {
  _id: string;
  title: string;
  location: {
    name: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  closedDay?: string;
}

interface ExhibitionMapProps {
  exhibitions: Exhibition[];
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
  showSearchBox?: boolean;
  height?: string;
}

export default function ExhibitionMap({ 
  exhibitions,
  onLocationSelect,
  showSearchBox = false,
  height = '500px'
}: ExhibitionMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  // Filtrer ut utstillinger uten koordinater
  const validExhibitions = exhibitions.filter(ex => 
    ex.location.coordinates && 
    ex.location.coordinates.lat && 
    ex.location.coordinates.lng
  );

  // Beregn senterpunkt for kartet
  const getMapCenter = useCallback(() => {
    if (validExhibitions.length === 0) {
      return { lat: 48.8566, lng: 2.3522 }; // Default til Paris
    }
    
    const sumLat = validExhibitions.reduce((sum, ex) => 
      sum + ex.location.coordinates!.lat, 0);
    const sumLng = validExhibitions.reduce((sum, ex) => 
      sum + ex.location.coordinates!.lng, 0);
    
    return {
      lat: sumLat / validExhibitions.length,
      lng: sumLng / validExhibitions.length
    };
  }, [validExhibitions]);

  // Initialiser kartet
  const initializeMap = useCallback(async () => {
    if (!mapRef.current) return;

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places']
    });

    try {
      const google = await loader.load();
      const center = getMapCenter();
      
      const mapOptions: google.maps.MapOptions = {
        center,
        zoom: validExhibitions.length > 0 ? 5 : 3,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      };

      const map = new google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;
      infoWindowRef.current = new google.maps.InfoWindow();

      // Legg til søkeboks hvis aktivert
      if (showSearchBox && searchInputRef.current) {
        const searchBox = new google.maps.places.SearchBox(searchInputRef.current);
        searchBoxRef.current = searchBox;

        map.controls[google.maps.ControlPosition.TOP_CENTER].push(searchInputRef.current);

        // Håndter søkeresultater
        searchBox.addListener('places_changed', () => {
          const places = searchBox.getPlaces();
          if (!places || places.length === 0) return;

          const place = places[0];
          if (!place.geometry || !place.geometry.location) return;

          // Oppdater kartet
          map.setCenter(place.geometry.location);
          map.setZoom(12);

          // Kall callback hvis den finnes
          if (onLocationSelect) {
            onLocationSelect({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng()
            });
          }
        });
      }

      // Legg til markører
      validExhibitions.forEach(exhibition => {
        if (!exhibition.location.coordinates) return;

        const marker = new google.maps.Marker({
          position: {
            lat: exhibition.location.coordinates.lat,
            lng: exhibition.location.coordinates.lng
          },
          map,
          title: exhibition.title,
          animation: google.maps.Animation.DROP
        });

        // Opprett info-vindu innhold
        const content = document.createElement('div');
        content.className = 'p-2';
        content.innerHTML = `
          <h3 class="font-bold text-sm mb-1">${exhibition.title}</h3>
          <p class="text-xs mb-1">${exhibition.location.name}, ${exhibition.location.city}</p>
          ${exhibition.closedDay ? `<p class="text-xs text-gray-600 mb-1">Stengt på ${exhibition.closedDay}er</p>` : ''}
          <a href="/exhibition/${exhibition._id}" class="text-rose-500 text-xs hover:underline">Se detaljer</a>
        `;

        // Legg til klikk-håndtering
        marker.addListener('click', () => {
          if (infoWindowRef.current) {
            infoWindowRef.current.setContent(content);
            infoWindowRef.current.open(map, marker);
          }
        });

        markersRef.current.push(marker);
      });

      // Tilpass kartutsnittet til å vise alle markører
      if (validExhibitions.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markersRef.current.forEach(marker => {
          bounds.extend(marker.getPosition()!);
        });
        map.fitBounds(bounds, 50);
      }

    } catch (error) {
      console.error('Error loading Google Maps:', error);
    }
  }, [validExhibitions, getMapCenter, showSearchBox, onLocationSelect]);

  // Initialiser kart når komponenten monteres
  useEffect(() => {
    initializeMap();

    return () => {
      // Rydd opp markører og infovindu
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [initializeMap]);

  return (
    <div className="relative w-full" style={{ height }}>
      {showSearchBox && (
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Søk etter sted..."
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 w-64 px-4 py-2 rounded-lg border border-gray-300 shadow-md"
        />
      )}
      <div ref={mapRef} className="w-full h-full rounded-lg overflow-hidden" />
      
      {validExhibitions.length === 0 && (
        <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
            <h3 className="text-xl font-bold mb-2">Ingen utstillinger med stedsdata</h3>
            <p className="text-gray-600 mb-4">
              Det er ingen utstillinger med koordinater å vise på kartet. Prøv å legge til utstillinger med gyldig stedsdata.
            </p>
            <Link href="/admin/exhibitions/new" className="text-rose-500 hover:underline">
              Legg til utstilling med koordinater
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}