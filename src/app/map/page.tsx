'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
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
}

export default function MapPage() {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchExhibitions = async () => {
      try {
        const response = await fetch('/api/exhibitions');
        if (!response.ok) {
          throw new Error('Failed to fetch exhibitions');
        }
        const data = await response.json();
        setExhibitions(data.data);
      } catch (error) {
        console.error('Error fetching exhibitions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchExhibitions();
  }, []);
  
  // Group exhibitions by city
  const exhibitionsByCity: Record<string, Exhibition[]> = {};
  exhibitions.forEach((exhibition) => {
    const city = exhibition.location.city;
    if (!exhibitionsByCity[city]) {
      exhibitionsByCity[city] = [];
    }
    exhibitionsByCity[city].push(exhibition);
  });
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Exhibitions by Location</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Map visualization placeholder */}
            <div className="bg-white rounded-lg shadow-md p-4 h-96 flex items-center justify-center">
              <div className="text-center">
                <p className="text-xl text-gray-500 mb-4">Interactive Map Coming Soon</p>
                <p className="text-gray-600">
                  We're working on adding a full interactive map.
                </p>
              </div>
            </div>
            
            {/* City-based exhibition listing */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Exhibitions by City</h2>
              
              {Object.keys(exhibitionsByCity).length === 0 ? (
                <p className="text-gray-500">No exhibitions found.</p>
              ) : (
                <div className="space-y-6">
                  {Object.entries(exhibitionsByCity).map(([city, exs]) => (
                    <div key={city} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <h3 className="text-lg font-semibold mb-2">{city}</h3>
                      <ul className="space-y-2">
                        {exs.map((ex) => (
                          <li key={ex._id}>
                            <Link href={`/exhibition/${ex._id}`} className="text-rose-500 hover:text-rose-700 hover:underline">
                              {ex.title} - {ex.location.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}