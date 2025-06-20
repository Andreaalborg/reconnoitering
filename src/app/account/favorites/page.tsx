'use client';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ExhibitionCard from '@/components/ExhibitionCard';

interface Exhibition {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    city: string;
    country: string;
  };
}

function FavoritesContent() {
  const { status } = useSession();
  const router = useRouter();

  const [favorites, setFavorites] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/account/favorites');
      return;
    }

    const fetchFavorites = async () => {
      if (status !== 'authenticated') return;

      try {
        const response = await fetch('/api/user/favorites', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch favorites: ${response.status}`);
        }

        const data = await response.json();
        setFavorites(data.data || []);
      } catch (err) {
        console.error('Error fetching favorites:', err);
        setError('Failed to load favorites. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchFavorites();
    }
  }, [status, router]);

  const handleRemoveFavorite = async (id: string) => {
    try {
      const response = await fetch(`/api/user/favorites/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to remove from favorites');
      }

      setFavorites(favorites.filter(fav => fav._id !== id));
      alert('Removed from favorites!');
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Failed to remove from favorites. Please try again.');
    }
  };

  if (status === 'loading' || (status === 'authenticated' && loading)) {
    return (
      <div className="min-h-screen">
        <main className="container-wide py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--secondary)]"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="container-wide py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-serif text-[var(--primary)] mb-6">My Favorite Exhibitions</h1>

        {error && (
          <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="card-minimal p-6 sm:p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">No favorites yet</h2>
            <p className="text-[var(--text-muted)] mb-6">
              Start exploring exhibitions and save your favorites to see them here.
            </p>

            <Link
              href="/exhibitions"
              className="btn-primary inline-block"
            >
              Browse Exhibitions
            </Link>
          </div>
        ) : (
          <div className="exhibition-grid">
            {favorites.map((exhibition) => (
              <div key={exhibition._id} className="relative group">
                <ExhibitionCard
                  id={exhibition._id}
                  title={exhibition.title}
                  location={exhibition.location}
                  coverImage={exhibition.coverImage}
                  startDate={exhibition.startDate}
                  endDate={exhibition.endDate}
                  minimal={true}
                />
                <button
                  onClick={() => handleRemoveFavorite(exhibition._id)}
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 sm:transition-opacity touch-device:opacity-100"
                  aria-label="Remove from favorites"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-[var(--secondary)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function FavoritesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <FavoritesContent />
    </Suspense>
  );
}
