'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import ImageUpload from '@/components/ImageUpload';
import AsyncSelect from 'react-select/async';

interface SimpleVenue {
  _id: string;
  name: string;
  address?: string;
  city: string;
  country: string;
}

interface PopulatedExhibition {
  _id: string;
  title: string;
  venue: SimpleVenue;
  description?: string;
  startDate: string;
  endDate: string;
  imageUrl?: string;
  tags?: string[];
  ticketUrl?: string;
  websiteUrl?: string;
  notes?: string;
}

function EditExhibitionContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [formData, setFormData] = useState<Partial<PopulatedExhibition>>({});
  const [selectedVenue, setSelectedVenue] = useState<SimpleVenue | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (session?.user?.role !== 'admin') {
       console.log('Bruker er ikke admin, omdirigerer...');
       router.push('/admin/login');
     }
  }, [status, session, router]);

  useEffect(() => {
    if (id && status === 'authenticated' && session?.user?.role === 'admin') {
      setIsFetching(true);
      setError('');
      fetch(`/api/admin/exhibitions/${id}`)
        .then(async (res) => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.error || `Failed to fetch exhibition (${res.status})`);
          }
          return res.json();
        })
        .then(data => {
          if (data.success && data.data) {
            const exhibition: PopulatedExhibition = data.data;
            const formattedStartDate = exhibition.startDate ? new Date(exhibition.startDate).toISOString().split('T')[0] : '';
            const formattedEndDate = exhibition.endDate ? new Date(exhibition.endDate).toISOString().split('T')[0] : '';
            
            setFormData({
              ...exhibition,
              startDate: formattedStartDate,
              endDate: formattedEndDate,
            });
            if (exhibition.venue) {
               setSelectedVenue(exhibition.venue);
               setSelectedVenueId(exhibition.venue._id);
            }
          } else {
            throw new Error(data.error || 'Exhibition not found or invalid data');
          }
        })
        .catch(err => {
          console.error("Error fetching exhibition:", err);
          setError(`Could not load exhibition: ${err.message}`);
        })
        .finally(() => {
            setIsFetching(false);
            setLoading(false);
        });
    }
  }, [id, status, session]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value.split(',').map(item => item.trim()).filter(Boolean) }));
  };

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }));
  };

  const loadVenueOptions = async (inputValue: string): Promise<{ value: string; label: string }[]> => {
    let apiUrl = '/api/admin/venues?limit=20'; 
    if (inputValue && inputValue.length >= 2) {
      apiUrl = `/api/admin/venues?q=${encodeURIComponent(inputValue)}&limit=10`;
    }
    try {
      const response = await fetch(apiUrl); 
      if (!response.ok) throw new Error('Kunne ikke laste venues');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data.map((venue: SimpleVenue) => ({
          value: venue._id,
          label: `${venue.name} (${venue.city}, ${venue.country})` 
        }));
      } else return [];
    } catch (error) {
      console.error('Feil ved lasting av venue-alternativer:', error);
      return []; 
    }
  };

  const handleVenueSelectionChange = (selectedOption: { value: string; label: string } | null) => {
    if (selectedOption) {
       setSelectedVenueId(selectedOption.value); 
       const nameMatch = selectedOption.label.match(/^([^\(]+)/);
       const locationMatch = selectedOption.label.match(/\(([^,]+),\s*([^\)]+)\)/);
       setSelectedVenue({
         _id: selectedOption.value,
         name: nameMatch ? nameMatch[1].trim() : 'Ukjent Venue', 
         city: locationMatch ? locationMatch[1].trim() : '',
         country: locationMatch ? locationMatch[2].trim() : '',
       });
        setError(''); 
    } else {
        setSelectedVenue(null);
        setSelectedVenueId(null);
    }
  };

  const VenueSelector = () => (
    <div className="mb-6 p-4 border border-dashed border-gray-300 rounded bg-gray-50">
      <label htmlFor="venue-select" className="block text-sm font-medium text-gray-700 mb-2">Bytt Venue (valgfritt)</label>
      <AsyncSelect
        id="venue-select"
        instanceId="venue-edit-select-instance" 
        cacheOptions 
        defaultOptions={true} 
        loadOptions={loadVenueOptions} 
        onChange={handleVenueSelectionChange} 
        placeholder="Søk for å bytte venue..." 
        noOptionsMessage={({ inputValue }) => 
            !inputValue || inputValue.length < 2 ? 'Ingen treff (viser standardliste)' : 'Fant ingen venues' 
          }
        loadingMessage={() => 'Laster venues...'} 
        isClearable 
        value={selectedVenue ? { value: selectedVenue._id, label: `${selectedVenue.name} (${selectedVenue.city}, ${selectedVenue.country})` } : null}
        classNamePrefix="react-select" 
      />
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!selectedVenueId) {
      setError('Venue må være valgt.');
      setLoading(false);
      return;
    }
    if (!formData.title || !formData.startDate || !formData.endDate) {
      setError('Tittel, Startdato og Sluttdato er påkrevde felt.');
      setLoading(false);
      return;
    }
    
    const dataToSend = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        startDate: formData.startDate,
        endDate: formData.endDate,
        tags: formData.tags,
        ticketUrl: formData.ticketUrl,
        websiteUrl: formData.websiteUrl,
        notes: formData.notes,
        venueId: selectedVenueId
    };

    try {
      const response = await fetch(`/api/admin/exhibitions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });
      
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Kunne ikke oppdatere utstillingen');
      }
      
      alert('Utstilling oppdatert!');
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error('Feil ved oppdatering:', err);
      setError(err.message || 'En feil oppstod ved lagring.');
    } finally {
      setLoading(false);
    }
  };

  if (isFetching || status === 'loading') {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Laster utstillingsdata...</p></div>;
  }
  
  if (status !== 'authenticated' || session?.user?.role !== 'admin') {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Ingen tilgang.</p></div>;
  }
  
  if (!formData.title && !isFetching) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Kunne ikke laste utstillingsdata. {error}</p></div>;
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
              </div>
            </div>
            <div className="flex items-center">
              {session?.user?.name && <span className="text-gray-700 mr-4">{session.user.name}</span>}
              <button onClick={() => router.push('/api/auth/signout')} className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">Logout</button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rediger Utstilling</h1>
          <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">Tilbake</Link>
        </div>
        
        {error && <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-400 rounded">{error}</div>}

        {selectedVenue && (
           <div className="mb-6 p-4 border border-green-200 bg-green-50 rounded-lg">
             <h3 className="text-md font-semibold text-green-800 mb-1">Nåværende Venue:</h3>
             <p className="text-sm text-green-700">
                <strong>{selectedVenue.name}</strong> ({selectedVenue.city}, {selectedVenue.country})
             </p>
           </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
           
           <VenueSelector />
           
           <hr className="my-4"/> 
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Utstillingsdetaljer</h2>
           
            <div>
             <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Tittel *</label>
             <input
               type="text"
               id="title"
               name="title"
               value={formData.title || ''}
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
               value={formData.description || ''}
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
                 value={formData.startDate || ''}
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
                 value={formData.endDate || ''}
                 onChange={handleChange}
                 required
                 className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
               />
             </div>
           </div>

            <div>
               <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (komma-separert)</label>
               <input
                 type="text"
                 id="tags"
                 name="tags"
                 value={formData.tags?.join(', ') || ''}
                 onChange={handleArrayChange}
                 placeholder="f.eks. samtidskunst, fotografi, skulptur"
                 className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
               />
             </div>

           <div>
             <label htmlFor="ticketUrl" className="block text-sm font-medium text-gray-700 mb-1">Billett-URL</label>
             <input
               type="url"
               id="ticketUrl"
               name="ticketUrl"
               value={formData.ticketUrl || ''}
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
               value={formData.websiteUrl || ''}
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
               value={formData.notes || ''}
               onChange={handleChange}
               className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
             ></textarea>
           </div>
          
           <div className="flex justify-end pt-4">
             <button
               type="submit"
               disabled={loading}
               className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-6 rounded transition duration-300 disabled:opacity-50"
             >
               {loading ? 'Oppdaterer...' : 'Oppdater Utstilling'}
             </button>
           </div>
         </form>
     </div>
    </div>
  );
}

export default function EditExhibitionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-100 flex items-center justify-center"><p>Laster...</p></div>} >
      <EditExhibitionContent />
    </Suspense>
  );
}