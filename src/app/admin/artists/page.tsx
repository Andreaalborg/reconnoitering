'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'react-hot-toast';

interface Artist {
  _id: string;
  name: string;
  slug: string;
  bio?: string;
  imageUrl?: string;
  websiteUrl?: string;
}

export default function ArtistsPage() {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newArtist, setNewArtist] = useState({ 
    name: '', 
    bio: '',
    websiteUrl: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      const response = await fetch('/api/admin/artists');
      if (!response.ok) throw new Error('Failed to fetch artists');
      const data = await response.json();
      setArtists(data.data);
    } catch (error) {
      console.error('Error fetching artists:', error);
      toast.error('Kunne ikke hente kunstnere');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/artists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArtist)
      });

      if (!response.ok) throw new Error('Failed to create artist');
      
      await fetchArtists();
      setNewArtist({ name: '', bio: '', websiteUrl: '' });
      toast.success('Kunstner opprettet');
    } catch (error) {
      console.error('Error creating artist:', error);
      toast.error('Kunne ikke opprette kunstner');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne kunstneren?')) return;

    try {
      const response = await fetch(`/api/admin/artists/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete artist');
      
      await fetchArtists();
      toast.success('Kunstner slettet');
    } catch (error) {
      console.error('Error deleting artist:', error);
      toast.error('Kunne ikke slette kunstner');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Administrer Kunstnere</h1>

        {/* Ny kunstner form */}
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Legg til ny kunstner</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Navn *
              </label>
              <input
                type="text"
                id="name"
                value={newArtist.name}
                onChange={(e) => setNewArtist(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                Biografi
              </label>
              <textarea
                id="bio"
                value={newArtist.bio}
                onChange={(e) => setNewArtist(prev => ({ ...prev, bio: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                rows={3}
              />
            </div>
            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Nettside URL
              </label>
              <input
                type="url"
                id="websiteUrl"
                value={newArtist.websiteUrl}
                onChange={(e) => setNewArtist(prev => ({ ...prev, websiteUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Legger til...' : 'Legg til kunstner'}
            </button>
          </div>
        </form>

        {/* Kunstnere liste */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-lg font-semibold p-4 border-b">Eksisterende kunstnere</h2>
          {isLoading ? (
            <div className="p-4 text-center">Laster kunstnere...</div>
          ) : artists.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Ingen kunstnere funnet</div>
          ) : (
            <ul className="divide-y">
              {artists.map((artist) => (
                <li key={artist._id} className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{artist.name}</h3>
                    {artist.bio && (
                      <p className="text-sm text-gray-500 mt-1">{artist.bio}</p>
                    )}
                    {artist.websiteUrl && (
                      <a 
                        href={artist.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                      >
                        Besøk nettside
                      </a>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(artist._id)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    Slett
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 