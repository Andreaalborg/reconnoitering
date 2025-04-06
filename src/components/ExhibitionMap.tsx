'use client';

import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import Link from 'next/link';

// Sett mapbox token fra miljøvariable
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

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
}

export default function ExhibitionMap({ exhibitions }: { exhibitions: Exhibition[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Filtrer ut utstillinger uten koordinater
  const validExhibitions = exhibitions.filter(ex => 
    ex.location.coordinates && 
    ex.location.coordinates.lat && 
    ex.location.coordinates.lng
  );
  
  // Beregn senterpunkt for kartet (gjennomsnitt av alle koordinater)
  const getMapCenter = () => {
    if (validExhibitions.length === 0) {
      return { lng: 0, lat: 0 }; // Default til verdenssentrum
    }
    
    const sumLat = validExhibitions.reduce((sum, ex) => 
      sum + ex.location.coordinates!.lat, 0);
    const sumLng = validExhibitions.reduce((sum, ex) => 
      sum + ex.location.coordinates!.lng, 0);
    
    return {
      lat: sumLat / validExhibitions.length,
      lng: sumLng / validExhibitions.length
    };
  };

  useEffect(() => {
    // Opprette kartet når komponenten monteres
    if (!mapContainer.current || map.current) return;
    
    const center = getMapCenter();
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [center.lng, center.lat],
      zoom: validExhibitions.length > 0 ? 3 : 1
    });
    
    map.current.on('load', () => {
      setMapLoaded(true);
    });
    
    // Rydde opp ved avmontering
    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);
  
  // Legg til markører når kartet er lastet og når utstillingslisten endres
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Fjern eventuelle eksisterende markører
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(marker => marker.remove());
    
    // Legg til markør for hver utstilling med koordinater
    validExhibitions.forEach(exhibition => {
      if (!exhibition.location.coordinates) return;
      
      // Opprett popup-innhold
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <h3 class="font-bold text-sm">${exhibition.title}</h3>
        <p class="text-xs">${exhibition.location.name}, ${exhibition.location.city}</p>
        <a href="/exhibition/${exhibition._id}" class="text-rose-500 text-xs hover:underline">View Details</a>
      `;
      
      // Opprett popup
      const popup = new mapboxgl.Popup({ offset: 25 })
        .setDOMContent(popupContent);
      
      // Opprett og stil markør
      const marker = document.createElement('div');
      marker.className = 'marker';
      marker.style.width = '24px';
      marker.style.height = '24px';
      marker.style.backgroundImage = 'url(https://cdn-icons-png.flaticon.com/512/684/684908.png)';
      marker.style.backgroundSize = 'cover';
      marker.style.cursor = 'pointer';
      
      // Legg til markør på kartet
      new mapboxgl.Marker(marker)
        .setLngLat([exhibition.location.coordinates.lng, exhibition.location.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current!);
    });
    
    // Juster kartutsnittet til å vise alle markører
    if (validExhibitions.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      validExhibitions.forEach(exhibition => {
        if (exhibition.location.coordinates) {
          bounds.extend([
            exhibition.location.coordinates.lng,
            exhibition.location.coordinates.lat
          ]);
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [mapLoaded, exhibitions]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full min-h-[500px] rounded-lg overflow-hidden" />
      {!mapboxgl.supported() && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <p className="text-center text-gray-700">
          Your browser doesn&apos;t support Mapbox GL. Please try a different browser.
          </p>
        </div>
      )}
      {validExhibitions.length === 0 && (
        <div className="absolute inset-0 bg-gray-100/80 flex items-center justify-center">
          <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
            <h3 className="text-xl font-bold mb-2">No exhibitions with location data</h3>
            <p className="text-gray-600 mb-4">
              There are no exhibitions with coordinates to display on the map. Try adding exhibitions with valid location data.
            </p>
            <Link href="/admin/exhibitions/new" className="text-rose-500 hover:underline">
              Add Exhibition with Coordinates
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}