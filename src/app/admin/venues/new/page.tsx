'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import GoogleMap from '@/components/GoogleMap';

// Legg til type for session
interface UserSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

// Lista over europeiske land (samme som i exhibitions)
const EUROPEAN_COUNTRIES = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", 
  "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", 
  "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", 
  "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", 
  "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", 
  "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", 
  "Turkey", "Ukraine", "United Kingdom", "UK", "Vatican City"
];

// Legg til interface for MapMarker rett etter EUROPEAN_COUNTRIES
interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
}

export default function AddVenue() {
  const { data: session, status } = useSession() as { data: UserSession | null, status: string };
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    coordinates: {
      lat: null as number | null,
      lng: null as number | null
    },
    defaultClosedDays: [] as string[],
    websiteUrl: '',
    notes: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 59.9139, lng: 10.7522 }); // Default til Oslo
  const [mapMarkerPos, setMapMarkerPos] = useState<MapMarker | null>(null);
  const [countryWarning, setCountryWarning] = useState<string>('');
  
  // Dager i uka - konstant
  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/admin/login');
    }
  }, [status, session, router]);
  
  // Håndterer feltendringer
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Fjern advarsel hvis landet endres
    if (name === 'country') {
      setCountryWarning('');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Sjekk om landet er i Europa
    if (name === 'country') {
      const countryLower = value.trim().toLowerCase();
      if (countryLower && !EUROPEAN_COUNTRIES.map(c => c.toLowerCase()).includes(countryLower)) {
        setCountryWarning('Advarsel: Dette landet er utenfor det typiske europeiske fokusområdet.');
      }
    }
  };
  
  // Håndterer checkbox-endringer for stengte dager
  const handleClosedDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      defaultClosedDays: checked 
          ? [...prev.defaultClosedDays, value] // Legg til dag hvis avkrysset
          : prev.defaultClosedDays.filter(day => day !== value) // Fjern dag hvis ikke avkrysset
    }));
  };
  
  // Håndterer klikk på kartet
  const handleMapClick = (location: { lat: number; lng: number }) => {
    const newMarker: MapMarker = {
      id: 'venue-location',
      position: location,
      title: formData.name || 'Nytt utstillingssted'
    };
    
    setMapMarkerPos(newMarker);
    setFormData(prev => ({
      ...prev,
      coordinates: { lat: location.lat, lng: location.lng }
    }));
    
    // Utfør reverse geocoding for å få adresse, by og land
    reverseGeocodeAndUpdateForm(location);
  };
  
  // Håndterer når et sted er valgt fra søkeboksen
  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry || !place.geometry.location) return;

    const location = place.geometry.location;
    const addressComponents = place.address_components || [];
    
    // Mer detaljert logging for debugging
    console.log('Full place object:', place);
    console.log('Place address components:', JSON.stringify(addressComponents));

    let city = '';
    let country = '';
    let streetName = '';
    let streetNumber = '';
    let administrativeAreas: string[] = [];

    // Først samle alle administrative områder i en array for fallback
    addressComponents.forEach(component => {
      const types = component.types;
      if (types.includes('administrative_area_level_1')) {
        administrativeAreas.push(component.long_name);
      } else if (types.includes('administrative_area_level_2')) {
        administrativeAreas.push(component.long_name);
      } else if (types.includes('administrative_area_level_3')) {
        administrativeAreas.push(component.long_name);
      }
    });

    // Deretter finn by og land
    addressComponents.forEach(component => {
      const types = component.types;
      
      // By - prioritert rekkefølge
      if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('postal_town') && !city) {
        city = component.long_name;
      }
      
      // Land
      if (types.includes('country')) {
        country = component.long_name;
      }
      
      // Gate og nummer for adresse
      if (types.includes('route')) {
        streetName = component.long_name;
      }
      if (types.includes('street_number')) {
        streetNumber = component.long_name;
      }
    });

    // Fallback til administrative områder hvis by fortsatt er tom
    if (!city && administrativeAreas.length > 0) {
      // Bruk det minste/mest spesifikke administrative området (som oftest er byen)
      city = administrativeAreas[administrativeAreas.length - 1];
    }

    // Fjern "kommune" fra by-navnet hvis det er inkludert
    city = city.replace(/\s*kommune\s*/i, '');
    
    const address = place.formatted_address || `${streetName} ${streetNumber}`.trim(); 

    console.log('Parsed values before setting form data:', { 
      name: place.name, 
      address: address, 
      city: city, 
      country: country,
      coordinates: {
        lat: location.lat(),
        lng: location.lng()
      }
    });

    setFormData(prev => ({
      ...prev,
      name: place.name || prev.name, 
      address: address, 
      city: city || prev.city, 
      country: country || prev.country, 
      coordinates: {
        lat: location.lat(),
        lng: location.lng()
      },
      websiteUrl: place.website || prev.websiteUrl
    }));

    // Logg formData etter oppdatering (merk: dette vil vise forrige state pga. React state update timing)
    console.log('Form data after update:', formData);
    setTimeout(() => console.log('Form data after timeout:', formData), 10);

    // Gjenbruk eksisterende map/warning logikk
    const mapLocation = { lat: location.lat(), lng: location.lng() };
    setMapCenter(mapLocation);
    setMapMarkerPos({
      id: 'venue-location',
      position: mapLocation,
      title: place.name || 'Selected Location'
    });

    // Sjekk land for advarsel
    if (country && !EUROPEAN_COUNTRIES.map(c => c.toLowerCase()).includes(country.toLowerCase())) {
      setCountryWarning('Warning: This country is outside the typical European focus area.');
    } else {
      setCountryWarning('');
    }
  };
  
  // Funksjon for å utføre reverse geocoding og oppdatere skjemaet
  const reverseGeocodeAndUpdateForm = async (location: { lat: number; lng: number }) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/geocode?lat=${location.lat}&lng=${location.lng}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Kunne ikke utføre geocoding');
      }
      
      // Oppdater skjemaet med geocodingresultater
      setFormData(prev => ({
        ...prev,
        address: data.address || '',
        city: data.city || '',
        country: data.country || '',
        coordinates: { lat: location.lat, lng: location.lng }
      }));
      
      // Sjekk om landet er i Europa
      if (data.country && !EUROPEAN_COUNTRIES.map(c => c.toLowerCase()).includes(data.country.toLowerCase())) {
        setCountryWarning('Advarsel: Dette landet er utenfor det typiske europeiske fokusområdet.');
      } else {
        setCountryWarning('');
      }
    } catch (error) {
      console.error('Error with geocoding:', error);
      setError('Kunne ikke utføre geocoding. Vennligst fyll ut adresseinformasjonen manuelt.');
    } finally {
      setLoading(false);
    }
  };
  
  // Skjemainnsending
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Valider påkrevde felt
    if (!formData.name || !formData.city || !formData.country) {
      setError('Vennligst fyll ut alle obligatoriske felt');
      setLoading(false);
      return;
    }
    
    try {
      // Forbered data for sending
      const dataToSend = {
        ...formData,
        // Fjern coordinates hvis begge verdiene er null
        coordinates: formData.coordinates.lat && formData.coordinates.lng 
          ? formData.coordinates 
          : undefined
      };
      
      const response = await fetch('/api/admin/venues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Kunne ikke opprette venue');
      }
      
      router.push('/admin/venues');
    } catch (error) {
      console.error('Error creating venue:', error);
      setError(error instanceof Error ? error.message : 'Kunne ikke opprette venue. Vennligst prøv igjen.');
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Laster...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/" className="text-rose-500 text-xl font-bold">
                  Reconnoitering
                </Link>
              </div>
              <div className="ml-6 flex items-center space-x-4">
                <Link href="/admin/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Dashboard
                </Link>
                <Link href="/admin/venues" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Venues
                </Link>
                <Link href="/admin/exhibitions/new" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Add Exhibition
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Legg til nytt utstillingssted</h1>
          <Link 
            href="/admin/venues" 
            className="text-gray-600 hover:text-gray-900"
          >
            Tilbake til oversikten
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Grunnleggende informasjon</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Venue navn *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Adresse
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      By *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Land *
                    </label>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      required
                      list="countries"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <datalist id="countries">
                      {EUROPEAN_COUNTRIES.map((country) => (
                        <option key={country} value={country} />
                      ))}
                    </datalist>
                    {countryWarning && (
                      <p className="mt-1 text-sm text-amber-500">{countryWarning}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Nettside URL
                  </label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Notater (kun synlig for admin)
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vanlig stengedager
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`day-${day}`}
                          name="defaultClosedDays"
                          value={day}
                          checked={formData.defaultClosedDays.includes(day)}
                          onChange={handleClosedDaysChange}
                          className="h-4 w-4 text-rose-600 border-gray-300 rounded focus:ring-rose-500"
                        />
                        <label htmlFor={`day-${day}`} className="ml-2 text-sm text-gray-700">
                          {day}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Plassering på kartet</h2>
              <div className="h-96 bg-gray-100 rounded-lg overflow-hidden">
                <GoogleMap 
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                  center={mapCenter}
                  onClick={handleMapClick}
                  markers={mapMarkerPos ? [mapMarkerPos] : []}
                  showSearchBox={true}
                  onPlaceSelected={handlePlaceSelected}
                />
              </div>
              {formData.coordinates.lat && formData.coordinates.lng && (
                <p className="mt-2 text-sm text-gray-600">
                  Koordinater: {formData.coordinates.lat.toFixed(6)}, {formData.coordinates.lng.toFixed(6)}
                </p>
              )}
            </div>
            
            <div className="flex justify-end">
              <Link 
                href="/admin/venues" 
                className="mr-4 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Avbryt
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded disabled:opacity-50"
              >
                {loading ? 'Lagrer...' : 'Lagre utstillingssted'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 