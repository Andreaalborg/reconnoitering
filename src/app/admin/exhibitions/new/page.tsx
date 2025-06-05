// src/app/admin/exhibitions/new/page.tsx
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';

// Interface for Venue data (kun det vi trenger å vise)
interface SimpleVenue {
  _id: string;
  name: string;
  address?: string;
  city: string;
  country: string;
}

// Interface for Tag
interface Tag {
  _id: string;
  name: string;
  slug: string;
}

// Interface for Artist
interface Artist {
  _id: string;
  name: string;
  slug: string;
}

// Hjelpekomponent for å håndtere logikken (pga Suspense for useSearchParams)
function AddExhibitionContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Hent venueId fra URL etter at searchParams er tilgjengelig
  const venueIdFromUrl = searchParams ? searchParams.get('venueId') : null;
  
  // State for valgt/hentet venue og ID
  const [selectedVenue, setSelectedVenue] = useState<SimpleVenue | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(venueIdFromUrl);
  
  // State for tags og artists
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [availableArtists, setAvailableArtists] = useState<Artist[]>([]);
  
  // State for selve utstillingsskjemaet (uten lokasjonsfelter)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    imageUrl: '', // Endret fra coverImage for konsistens?
    startDate: '',
    endDate: '',
    tags: [] as string[], // Dette vil være array av tag IDs
    artists: [] as string[], // Dette vil være array av artist IDs
    ticketUrl: '',
    websiteUrl: '',
    notes: '', // Lagt til notes
    // FJERNET: location, category, artists, ticketPrice, popularity, closedDays
    // Disse bør hentes/settes basert på valgt Venue eller legges til senere hvis nødvendig
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingVenue, setFetchingVenue] = useState(!!venueIdFromUrl); // Laster hvis vi har ID fra URL
  const [error, setError] = useState('');
  // FJERNET: additionalImages, mapCenter, mapMarkerPos, countryWarning

  // Sjekk autentisering
  useEffect(() => {
    if (status === 'loading') return; // Vent hvis session laster
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (session?.user?.role !== 'admin') {
       console.log('Bruker er ikke admin, omdirigerer...');
       router.push('/admin/login'); // Eller en annen passende side
     }
  }, [status, session, router]);

  // Hent tags og artists når komponenten laster
  useEffect(() => {
    if (status === 'authenticated') {
      // Hent tags
      fetch('/api/admin/tags')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAvailableTags(data.data);
          }
        })
        .catch(err => console.error('Error fetching tags:', err));

      // Hent artists
      fetch('/api/admin/artists')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAvailableArtists(data.data);
          }
        })
        .catch(err => console.error('Error fetching artists:', err));
    }
  }, [status]);

  // Hent venue-data hvis ID kommer fra URL
  useEffect(() => {
    if (venueIdFromUrl && status === 'authenticated') {
      setFetchingVenue(true);
      setError('');
      fetch(`/api/admin/venues/${venueIdFromUrl}`)
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to fetch venue (${res.status})`);
          }
          return res.json();
        })
        .then(data => {
          if (data.success && data.data) {
            setSelectedVenue(data.data);
            setSelectedVenueId(data.data._id); // Bekreft ID
      } else {
            throw new Error(data.error || 'Venue not found or invalid data');
          }
        })
        .catch(err => {
          console.error("Error fetching venue by ID:", err);
          setError(`Could not load venue: ${err.message}. Please select one manually.`);
          setSelectedVenueId(null); // Nullstill slik at velger vises
        })
        .finally(() => setFetchingVenue(false));
    } else {
       setFetchingVenue(false); // Ingen ID fra URL, ikke last
    }
  }, [venueIdFromUrl, status]); // Kjør når ID eller status endres

  // Vanlig handleChange for input/textarea
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle array field changes (comma-separated values)
  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.split(',').map(item => item.trim()).filter(Boolean) }));
  };
  
  // Handle bildeopplasting
  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };
  
  // Funksjon for å laste venue-alternativer for AsyncSelect
  const loadVenueOptions = async (inputValue: string): Promise<{ value: string; label: string }[]> => {
    // Bestem API-endepunkt basert på input
    let apiUrl = '/api/admin/venues?limit=20'; // Hent de 20 nyeste som standard
    if (inputValue && inputValue.length >= 2) {
      apiUrl = `/api/admin/venues?q=${encodeURIComponent(inputValue)}&limit=10`; // Søk hvis input er lang nok
    }

    try {
      console.log(`Laster venues fra: ${apiUrl}`);
      const response = await fetch(apiUrl); 
      if (!response.ok) {
        throw new Error('Kunne ikke laste venues');
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        // Formater til { value, label }
        return data.data.map((venue: SimpleVenue) => ({
          value: venue._id,
          label: `${venue.name} (${venue.city}, ${venue.country})` 
        }));
      } else {
        return [];
      }
    } catch (error) {
      console.error('Feil ved lasting av venue-alternativer:', error);
      return []; // Returner tom liste ved feil
    }
  };
  
  // Håndterer valg fra AsyncSelect
  const handleVenueSelectionChange = (selectedOption: { value: string; label: string } | null) => {
    if (selectedOption) {
      // Trenger kanskje å hente full venue-info her hvis vi skal vise mer enn label?
      // For nå, antar vi at label har nok info, og vi setter ID.
      // Hvis vi trenger fullt objekt, må vi kalle API-et igjen med selectedOption.value
      // eller modifisere loadVenueOptions til å returnere hele objektet.
      
      // Enkel løsning: Hent info fra label (kan være upålitelig)
      const nameMatch = selectedOption.label.match(/^([^\(]+)/);
      const locationMatch = selectedOption.label.match(/\(([^,]+),\s*([^\)]+)\)/);
      
      const venueData: SimpleVenue = {
           _id: selectedOption.value,
           name: nameMatch ? nameMatch[1].trim() : 'Ukjent Venue', 
           city: locationMatch ? locationMatch[1].trim() : '',
           country: locationMatch ? locationMatch[2].trim() : '',
           // address mangler her, må evt. hentes separat
         };
      handleVenueSelected(venueData); // Bruk eksisterende handler

    } else {
      handleVenueSelected(null); // Nullstill hvis ingenting er valgt
    }
  };

  // --- TODO: Implementer VenueSelector-komponent og logikk --- 
  const handleVenueSelected = (venue: SimpleVenue | null) => {
    if (venue) {
      setSelectedVenue(venue);
      setSelectedVenueId(venue._id);
      setError(''); // Fjern eventuell feilmelding
    } else {
      setSelectedVenue(null);
      setSelectedVenueId(null);
    }
  };
  
  // Komponent for å velge Venue (Plassholder - må implementeres)
  const VenueSelector = () => (
    <div className="mb-6 p-4 border border-dashed border-gray-300 rounded bg-gray-50">
      <label htmlFor="venue-select" className="block text-sm font-medium text-gray-700 mb-2">Søk etter og velg Venue *</label>
      <AsyncSelect
        id="venue-select"
        instanceId="venue-select-instance"
        cacheOptions
        defaultOptions={true}
        loadOptions={loadVenueOptions}
        onChange={handleVenueSelectionChange}
        placeholder="Velg eller søk etter venue..."
        noOptionsMessage={({ inputValue }) => 
            !inputValue || inputValue.length < 2 ? 'Ingen treff (viser standardliste)' : 'Fant ingen venues'
          }
        loadingMessage={() => 'Laster venues...'}
        isClearable
        classNamePrefix="react-select"
      />
      <p className="text-sm text-gray-600 mt-3">
Mangler venuet du ser etter?
        <Link href="/admin/venues/new" className="ml-2 text-blue-600 hover:underline">
          Opprett et nytt venue
        </Link>
      </p>
    </div>
  );
  // --- Slutt på VenueSelector --- 
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Valider at et venue er valgt
    if (!selectedVenueId) {
      setError('Du må velge et venue for utstillingen.');
      setLoading(false);
      return;
    }
    
    // Valider andre påkrevde felt
    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('Tittel, Startdato og Sluttdato er påkrevde felt.');
      setLoading(false);
      return;
    }
    
    try {
       console.log("Sender data til API:", { ...formData, venueId: selectedVenueId });
      const response = await fetch('/api/admin/exhibitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
            venueId: selectedVenueId // Send den valgte venue IDen
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
         console.error("API Error Response:", result);
        throw new Error(result.error || 'Kunne ikke opprette utstillingen');
      }
      
      alert('Utstilling opprettet!');
      router.push('/admin/dashboard'); // Eller kanskje /admin/exhibitions?
    } catch (err: any) {
      console.error('Feil ved innsending:', err);
      setError(err.message || 'En feil oppstod ved lagring.');
    } finally {
      setLoading(false);
    }
  };
  
  // Tidlig return hvis session laster eller bruker ikke er admin
  if (status === 'loading' || fetchingVenue) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Laster...</div>
      </div>
    );
  }
  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
       // Bør ha blitt omdirigert, men som fallback
       return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Ingen tilgang.</p></div>;
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
                <Link href="/admin/exhibitions/new" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 bg-gray-100">
                  Add Exhibition
                </Link>
              </div>
             </div>
            {/* Viser brukerinfo/logout hvis nødvendig */}
            <div className="flex items-center">
              {session?.user?.name && <span className="text-gray-700 mr-4">{session.user.name}</span>}
               <button
                onClick={() => router.push('/api/auth/signout')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Legg til ny utstilling</h1>
          <Link 
            href="/admin/dashboard" // Gå tilbake til dashboard eller /admin/venues?
            className="text-gray-600 hover:text-gray-900"
          >
            Tilbake
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {/* --- Logikk for å vise Venue-info ELLER Velger --- */} 
        {!selectedVenueId && !fetchingVenue && (
            <VenueSelector />
        )}

        {selectedVenue && (
           <div className="mb-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
             <h2 className="text-lg font-semibold text-blue-800 mb-2">For Venue: {selectedVenue.name}</h2>
             <p className="text-sm text-blue-700">
               {selectedVenue.address && `${selectedVenue.address}, `}{selectedVenue.city}, {selectedVenue.country}
             </p>
             {/* Knapp for å bytte venue? */} 
              <button 
                onClick={() => handleVenueSelected(null)} 
                className="mt-2 text-sm text-blue-600 hover:underline"
              >
                (Bytt venue)
              </button>
           </div>
        )}
        {/* --- Slutt på logikk --- */} 
        
        {/* Vis selve skjemaet KUN hvis et venue er valgt */} 
        {selectedVenueId && (
          <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
           
            {/* --- Utstillingsspesifikke felt --- */} 
                <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Beskrivelse</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <ImageUpload
              initialImage={formData.imageUrl}
              onImageChange={handleImageChange}
              label="Bilde (Valgfritt)"
                        required={false}
                      />
                
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">Startdato *</label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">Sluttdato *</label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
                
                <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <Select
                    id="tags"
                    instanceId="tags-select"
                    isMulti
                    options={availableTags.map(tag => ({
                      value: tag._id,
                      label: tag.name
                    }))}
                    value={formData.tags.map(tagId => {
                      const tag = availableTags.find(t => t._id === tagId);
                      return tag ? { value: tag._id, label: tag.name } : null;
                    }).filter(Boolean)}
                    onChange={(selectedOptions) => {
                      setFormData(prev => ({
                        ...prev,
                        tags: selectedOptions ? selectedOptions.map(opt => opt.value) : []
                      }));
                    }}
                    placeholder="Velg tags..."
                    classNamePrefix="react-select"
                    noOptionsMessage={() => 'Ingen tags funnet'}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Mangler en tag? <Link href="/admin/tags" className="text-blue-600 hover:underline">Administrer tags</Link>
                  </p>
                </div>
                
                <div>
                  <label htmlFor="artists" className="block text-sm font-medium text-gray-700 mb-1">Kunstnere</label>
                  <Select
                    id="artists"
                    instanceId="artists-select"
                    isMulti
                    options={availableArtists.map(artist => ({
                      value: artist._id,
                      label: artist.name
                    }))}
                    value={formData.artists.map(artistId => {
                      const artist = availableArtists.find(a => a._id === artistId);
                      return artist ? { value: artist._id, label: artist.name } : null;
                    }).filter(Boolean)}
                    onChange={(selectedOptions) => {
                      setFormData(prev => ({
                        ...prev,
                        artists: selectedOptions ? selectedOptions.map(opt => opt.value) : []
                      }));
                    }}
                    placeholder="Velg kunstnere..."
                    classNamePrefix="react-select"
                    noOptionsMessage={() => 'Ingen kunstnere funnet'}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Mangler en kunstner? <Link href="/admin/artists" className="text-blue-600 hover:underline">Administrer kunstnere</Link>
                  </p>
                </div>
                
                <div>
              <label htmlFor="ticketUrl" className="block text-sm font-medium text-gray-700 mb-1">Billett-URL</label>
                  <input
                    type="url"
                    id="ticketUrl"
                    name="ticketUrl"
                    value={formData.ticketUrl}
                    onChange={handleChange}
                placeholder="https://..."
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">Utstillingens Nettside-URL</label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                placeholder="https://..."
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Interne Notater</label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              ></textarea>
            </div>
            
            {/* Send inn knapp */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-6 rounded transition duration-300 disabled:opacity-50"
              >
                {loading ? 'Lagrer...' : 'Lagre Utstilling'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}

// Wrap med Suspense for useSearchParams
export default function AddExhibitionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Laster...</p></div>}>
      <AddExhibitionContent />
    </Suspense>
  );
}