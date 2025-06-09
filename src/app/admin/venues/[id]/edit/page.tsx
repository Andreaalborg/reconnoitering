'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import GoogleMap from '@/components/GoogleMap';

// Typer og konstanter (kan evt. flyttes til en delt fil senere)
interface UserSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

const EUROPEAN_COUNTRIES = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", 
  "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", 
  "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", 
  "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", 
  "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", 
  "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", 
  "Turkey", "Ukraine", "United Kingdom", "UK", "Vatican City"
];

interface MapMarker {
  id: string;
  position: {
    lat: number;
    lng: number;
  };
  title: string;
}

interface FormData {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: number | null;
      lng: number | null;
    };
    defaultClosedDays: string[];
    websiteUrl: string;
    notes: string;
    isActive: boolean;
}

export default function EditVenue() {
  console.log("EditVenue komponent starter...");

  const { data: session, status } = useSession() as { data: UserSession | null, status: string };
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  console.log(`Venue ID fra params: ${id}`);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    address: '',
    city: '',
    country: '',
    coordinates: { lat: null, lng: null },
    defaultClosedDays: [],
    websiteUrl: '',
    notes: '',
    isActive: true
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 59.9139, lng: 10.7522 }); // Default til Oslo
  const [mapMarkerPos, setMapMarkerPos] = useState<MapMarker | null>(null);
  const [countryWarning, setCountryWarning] = useState<string>('');
  const [isFetching, setIsFetching] = useState(true);

  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Hent venue data når ID er tilgjengelig
  useEffect(() => {
    console.log("useEffect kjører. Status:", status, "ID:", id);

    if (status === 'loading') {
       console.log("Session status er 'loading', venter...");
       return;
     }

    if (status === 'unauthenticated') {
      console.log("Ikke autentisert, omdirigerer til login...");
      router.push('/admin/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
       console.log('Bruker er ikke admin, omdirigerer...');
       router.push('/admin/login');
       return;
    }

    if (id && status === 'authenticated' && session?.user?.role === 'admin') {
      console.log("Starter fetchVenueData for ID:", id);
      const fetchVenueData = async () => {
        setIsFetching(true);
        setError('');
        try {
          const response = await fetch(`/api/admin/venues/${id}`);
          console.log("Fetch response status:", response.status);

          if (!response.ok) {
            let errorMsg = `HTTP error! status: ${response.status}`;
            try {
              const errorData = await response.json();
              errorMsg = errorData.error || errorMsg;
              console.error("Fetch error data:", errorData);
            } catch (jsonError) {
              console.error("Kunne ikke parse error JSON", jsonError);
            }
            throw new Error(errorMsg);
          }
          
          const data = await response.json();
          console.log("Mottatt data fra API:", data);

          if (data.success && data.data) {
            const venue = data.data;
            console.log("Setter form data med venue:", venue);
            setFormData({
              name: venue.name || '',
              address: venue.address || '',
              city: venue.city || '',
              country: venue.country || '',
              coordinates: { 
                lat: venue.coordinates?.lat ?? null,
                lng: venue.coordinates?.lng ?? null
              },
              defaultClosedDays: venue.defaultClosedDays || [],
              websiteUrl: venue.websiteUrl || '',
              notes: venue.notes || '',
              isActive: venue.isActive ?? true
            });

            if (venue.coordinates?.lat && venue.coordinates?.lng) {
                const coords = { lat: venue.coordinates.lat, lng: venue.coordinates.lng };
                console.log("Setter kart senter og markør:", coords);
                setMapCenter(coords);
                setMapMarkerPos({ id: 'venue-location', position: coords, title: venue.name });
            } else {
              console.log("Ingen koordinater funnet for kart.");
            }
          } else {
             console.error("API returnerte success=true men ingen data, eller success=false", data);
            throw new Error(data.error || 'Ugyldig dataformat fra API');
          }
        } catch (err: any) {
          console.error('Feil i fetchVenueData:', err);
          setError(err.message || 'En feil oppstod under henting av data');
        } finally {
          console.log("fetchVenueData ferdig.");
          setIsFetching(false);
          setLoading(false); 
        }
      };
      fetchVenueData();
    } else {
      console.log("Betingelser for fetch ikke møtt (mangler id, ikke auth/admin).");
    }
  }, [id, status, session, router]);

  // --- Funksjoner for handleChange, handleClosedDaysChange, handleMapClick, handlePlaceSelected (nesten identiske som i AddVenue) ---

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'country') setCountryWarning('');
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'country') {
      const countryLower = value.trim().toLowerCase();
      if (countryLower && !EUROPEAN_COUNTRIES.map(c => c.toLowerCase()).includes(countryLower)) {
        setCountryWarning('Advarsel: Land utenfor Europa.');
      }
    }
  };

  const handleClosedDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      defaultClosedDays: checked 
          ? [...prev.defaultClosedDays, value] 
          : prev.defaultClosedDays.filter(day => day !== value) 
    }));
  };

  const handleMapClick = (location: { lat: number; lng: number }) => {
    const newMarker: MapMarker = { id: 'venue-location', position: location, title: formData.name || 'Valgt lokasjon' };
    setMapMarkerPos(newMarker);
    setFormData(prev => ({ ...prev, coordinates: { lat: location.lat, lng: location.lng } }));
    reverseGeocodeAndUpdateForm(location);
  };

  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
     if (!place.geometry || !place.geometry.location) return;
     const location = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
     
     let cityName = '';
     const locality = place.address_components?.find(comp => comp.types.includes('locality'));
     const adminArea2 = place.address_components?.find(comp => comp.types.includes('administrative_area_level_2'));
     const adminArea1 = place.address_components?.find(comp => comp.types.includes('administrative_area_level_1'));
     if (locality) cityName = locality.long_name;
     else if (adminArea2) cityName = adminArea2.long_name;
     else if (adminArea1) cityName = adminArea1.long_name;
     cityName = cityName.replace(/\s*kommune\s*/i, '');

     setFormData(prev => ({
       ...prev,
       name: place.name || '',
       address: place.formatted_address || '',
       city: cityName,
       country: place.address_components?.find(comp => comp.types.includes('country'))?.long_name || '',
       coordinates: location,
       websiteUrl: place.website || ''
     }));

     setMapCenter(location);
     setMapMarkerPos({ id: 'venue-location', position: location, title: place.name || 'Valgt lokasjon' });

     const country = place.address_components?.find(comp => comp.types.includes('country'))?.long_name;
     if (country && !EUROPEAN_COUNTRIES.map(c => c.toLowerCase()).includes(country.toLowerCase())) {
       setCountryWarning('Advarsel: Land utenfor Europa.');
     } else {
       setCountryWarning('');
     }
  };

   // Funksjon for reverse geocoding (koblet til API)
   const reverseGeocodeAndUpdateForm = async (location: { lat: number; lng: number }) => {
     setError('');
     try {
       const response = await fetch(`/api/geocode?lat=${location.lat}&lng=${location.lng}`);
       const data = await response.json();
       if (!response.ok) {
         throw new Error(data.error || 'Kunne ikke utføre reverse geocoding');
       }
       setFormData(prev => ({
         ...prev,
         address: data.address || prev.address,
         city: data.city || prev.city,
         country: data.country || prev.country
       }));
        if (data.country && !EUROPEAN_COUNTRIES.map(c => c.toLowerCase()).includes(data.country.toLowerCase())) {
          setCountryWarning('Advarsel: Land utenfor Europa.');
        } else {
          setCountryWarning('');
        }
     } catch (err: any) {
       console.error('Feil ved reverse geocoding:', err);
       setError('Kunne ikke hente adresseinformasjon fra kartklikk.');
     }
   };

  // --- Funksjon for handleSubmit (oppdatert for PUT-request) ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validering (samme som i AddVenue)
    if (!formData.name || !formData.city || !formData.country) {
      setError('Navn, By og Land er påkrevde felt.');
      setLoading(false);
      return;
    }

    // Forbered data for sending
    const dataToSend: any = {
      name: formData.name,
      location: {
        address: formData.address,
        city: formData.city,
        country: formData.country,
        // Kun inkluder koordinater hvis begge er satt
        ...(formData.coordinates.lat !== null && formData.coordinates.lng !== null && {
          coordinates: [formData.coordinates.lng, formData.coordinates.lat] // GeoJSON format [lng, lat]
        })
      },
      defaultClosedDays: formData.defaultClosedDays,
      websiteUrl: formData.websiteUrl,
      notes: formData.notes,
      isActive: formData.isActive // Ta med aktiv status
    };

    try {
      const response = await fetch(`/api/admin/venues/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Kunne ikke oppdatere venue');
      }

      alert('Venue oppdatert!');
      router.push('/admin/venues'); // Omdiriger tilbake til listen

    } catch (err: any) {
      console.error('Feil ved oppdatering:', err);
      setError(err.message || 'En feil oppstod under oppdatering.');
    } finally {
      setLoading(false);
    }
  };

  // Håndterer endring av aktiv status
   const handleActiveChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       setFormData(prev => ({ ...prev, isActive: e.target.checked }));
   };

  // --- Return statement --- 
  console.log(`Rendrer EditVenue. Status: ${status}, isFetching: ${isFetching}`);

  if (status === 'loading' || isFetching) {
    console.log("Viser Laster... melding");
    return <div className="flex justify-center items-center h-screen"><p>Laster...</p></div>;
  }

  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'admin')) {
     console.log("Viser Omdirigerer... melding (dobbeltsjekk)");
     return <div className="flex justify-center items-center h-screen"><p>Omdirigerer til login...</p></div>;
   }

  console.log("Rendrer selve skjemaet");
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rediger Venue</h1>
        <Link href="/admin/venues" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition duration-300">
          Tilbake til Oversikt
        </Link>
      </div>

      {error && <p className="text-red-500 bg-red-100 border border-red-400 p-3 rounded mb-4">{error}</p>}
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
        
         {/* Aktivitetsstatus */}
         <div className="flex items-center">
             <input
               type="checkbox"
               id="isActive"
               name="isActive"
               checked={formData.isActive}
               onChange={handleActiveChange}
               className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
             />
             <label htmlFor="isActive" className="text-gray-700 font-medium">Aktiv</label>
          </div>

        {/* Navn */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Navn *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Adresse */}
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* By */}
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">By *</label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Land */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">Land *</label>
          <input
            type="text"
            id="country"
            name="country"
            value={formData.country}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
           {countryWarning && <p className="text-sm text-yellow-600 mt-1">{countryWarning}</p>}
        </div>

         {/* Google Map Integrasjon */}
         <div className="mb-6">
           <h3 className="text-lg font-medium text-gray-900 mb-2">Velg sted på kart</h3>
           <p className="text-sm text-gray-600 mb-3">
             Klikk på kartet for å sette en markør og hente koordinater, eller bruk søkefeltet.
           </p>
           <div className="h-96 w-full border border-gray-300 rounded-md overflow-hidden">
             <GoogleMap
               center={mapCenter}
               zoom={6} // Justert zoom
               markers={mapMarkerPos ? [mapMarkerPos] : []}
               onClick={handleMapClick}
               onPlaceSelected={handlePlaceSelected} // Send valgt sted tilbake hit
               apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
               isMainMarkerDraggable={true} // Tillat dra og slipp av hovedmarkør
               mainMarker={mapMarkerPos ?? undefined} // Send inn markørposisjon
               onMarkerDragEnd={handleMapClick} // Bruk samme funksjon for å oppdatere posisjon etter dra
               showSearchBox={true}
             />
           </div>
           <div className="mt-2 text-sm text-gray-600">
             Valgte koordinater: Lat: {formData.coordinates.lat?.toFixed(4) ?? 'Ikke satt'}, Lng: {formData.coordinates.lng?.toFixed(4) ?? 'Ikke satt'}
           </div>
         </div>


        {/* Stengte dager */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vanligvis stengt</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="flex items-center">
                <input
                  type="checkbox"
                  id={`closed-${day}`}
                  name="defaultClosedDays"
                  value={day}
                  checked={formData.defaultClosedDays.includes(day)}
                  onChange={handleClosedDaysChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
                />
                <label htmlFor={`closed-${day}`} className="text-gray-700">{day}</label>
              </div>
            ))}
          </div>
        </div>

        {/* Nettsted URL */}
        <div>
          <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">Nettsted URL</label>
          <input
            type="url"
            id="websiteUrl"
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Notater */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notater</label>
          <textarea
            id="notes"
            name="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
        </div>

        {/* Send inn knapp */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Oppdaterer...' : 'Oppdater Venue'}
          </button>
        </div>
      </form>
    </div>
  );
} 