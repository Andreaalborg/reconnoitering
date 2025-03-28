'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import ExhibitionCard from '@/components/ExhibitionCard';
import VerticalCalendar from '@/components/VerticalCalendar';

interface Exhibition {
  _id: string;
  title: string;
  location: {
    name: string;
    city: string;
    country: string;
  };
  coverImage: string;
  startDate: string;
  endDate: string;
}

function HomeContent() {
  const [upcomingExhibitions, setUpcomingExhibitions] = useState<Exhibition[]>([]);
  const [popularExhibitions, setPopularExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch upcoming exhibitions
        const upcomingRes = await fetch('/api/exhibitions?sort=startDate&limit=6');
        const upcomingData = await upcomingRes.json();
        
        // Fetch popular exhibitions
        const popularRes = await fetch('/api/exhibitions?sort=-popularity&limit=6');
        const popularData = await popularRes.json();
        
        if (upcomingData.success && popularData.success) {
          setUpcomingExhibitions(upcomingData.data || []);
          setPopularExhibitions(popularData.data || []);
        } else {
          throw new Error('Failed to fetch exhibitions');
        }
      } catch (err) {
        console.error('Error fetching exhibitions:', err);
        setError('Failed to load exhibitions. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">Discover Art Exhibitions Worldwide</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Find the perfect exhibitions for your next trip based on your travel dates and interests
        </p>
        
        <div className="mt-10">
          <Link 
            href="/exhibitions" 
            className="bg-rose-500 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-rose-600 transition-colors duration-300"
          >
            Browse Exhibitions
          </Link>
        </div>
      </section>
      
      {/* Two-column layout for calendar and upcoming exhibitions */}
      <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vertical Calendar - Takes 1/3 of the space on large screens */}
        <div className="lg:col-span-1">
          <VerticalCalendar />
        </div>
        
        {/* Upcoming Exhibitions - Takes 2/3 of the space on large screens */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Upcoming Events</h2>
            <Link href="/exhibitions?sort=startDate" className="text-rose-500 hover:underline">
              Show all
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {upcomingExhibitions.map((exhibition) => (
              <ExhibitionCard
                key={exhibition._id}
                id={exhibition._id}
                title={exhibition.title}
                location={exhibition.location}
                coverImage={exhibition.coverImage}
                startDate={exhibition.startDate}
                endDate={exhibition.endDate}
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Popular Exhibitions */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Popular Events</h2>
          <Link href="/exhibitions?sort=popularity" className="text-rose-500 hover:underline">
            Show all
          </Link>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {popularExhibitions.map((exhibition) => (
            <ExhibitionCard
              key={exhibition._id}
              id={exhibition._id}
              title={exhibition.title}
              location={exhibition.location}
              coverImage={exhibition.coverImage}
              startDate={exhibition.startDate}
              endDate={exhibition.endDate}
            />
          ))}
        </div>
      </section>
      
      {/* Features Section */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-rose-500 text-4xl mb-4">🗓️</div>
            <h3 className="text-xl font-bold mb-2">Search by Date</h3>
            <p className="text-gray-600">
              Find exhibitions that match your travel schedule, so you never miss an opportunity.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-rose-500 text-4xl mb-4">🌍</div>
            <h3 className="text-xl font-bold mb-2">Explore by Location</h3>
            <p className="text-gray-600">
              Discover exhibitions in your destination city or within a specific radius.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-rose-500 text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-2">Filter by Interest</h3>
            <p className="text-gray-600">
              Focus on the art styles, artists, and themes that interest you most.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Suspense fallback={<div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>}>
          <HomeContent />
        </Suspense>
      </main>
      
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500">
            © {new Date().getFullYear()} Reconnoitering. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}