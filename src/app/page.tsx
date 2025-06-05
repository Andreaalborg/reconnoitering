'use client';
export const dynamic = 'force-dynamic';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
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
  const { data: session } = useSession();
  const [upcomingExhibitions, setUpcomingExhibitions] = useState<Exhibition[]>([]);
  const [popularExhibitions, setPopularExhibitions] = useState<Exhibition[]>([]);
  const [recommendedExhibitions, setRecommendedExhibitions] = useState<Exhibition[]>([]);
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
        
        // Fetch recommended exhibitions if user is logged in
        if (session?.user) {
          try {
            const recommendedRes = await fetch('/api/recommendation?limit=6');
            const recommendedData = await recommendedRes.json();
            
            if (recommendedData.success) {
              setRecommendedExhibitions(recommendedData.data || []);
            }
          } catch (err) {
            console.error('Error fetching recommendations:', err);
            // Don't fail the whole page if recommendations fail
          }
        }
      } catch (err) {
        console.error('Error fetching exhibitions:', err);
        setError('Failed to load exhibitions. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [session]);

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
      <section className="mb-16 text-center animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 gradient-text">
          Oppdag kunstutstillinger verden over
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-10">
          Finn de perfekte utstillingene for din neste reise basert på dine reisedatoer og interesser
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/exhibitions" 
            className="btn-primary inline-block"
          >
            Utforsk utstillinger
          </Link>
          <Link 
            href="/map" 
            className="bg-white text-gray-700 px-8 py-3 rounded-full text-lg font-medium hover:bg-gray-100 transition-all duration-300 border border-gray-200 inline-block"
          >
            Se på kart 🗺️
          </Link>
        </div>
      </section>
      
      {/* Two-column layout for calendar and upcoming exhibitions */}
      <section className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-delay">
        {/* Vertical Calendar - Takes 1/3 of the space on large screens */}
        <div className="lg:col-span-1">
          <VerticalCalendar />
        </div>
        
        {/* Upcoming Exhibitions - Takes 2/3 of the space on large screens */}
        <div className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Kommende utstillinger</h2>
            <Link href="/exhibitions?sort=startDate" className="text-rose-500 hover:text-rose-600 font-medium transition-colors">
              Vis alle →
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {upcomingExhibitions.map((exhibition, index) => (
              <div key={exhibition._id} className={`animate-fade-in-delay-${index + 1}`}>
                <ExhibitionCard
                  id={exhibition._id}
                  title={exhibition.title}
                  location={exhibition.location}
                  coverImage={exhibition.coverImage}
                  startDate={exhibition.startDate}
                  endDate={exhibition.endDate}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Recommended Exhibitions */}
      {session?.user && recommendedExhibitions.length > 0 && (
        <section className="mb-16 animate-fade-in-delay-2">
          <div className="bg-gradient-to-r from-rose-50 to-indigo-50 rounded-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">Anbefalt for deg</h2>
                <p className="text-gray-600">Basert på dine preferanser og tidligere besøk</p>
              </div>
              <Link href="/account/preferences" className="text-rose-500 hover:text-rose-600 font-medium transition-colors">
                Tilpass preferanser →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {recommendedExhibitions.map((exhibition) => (
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
      )}
      
      {/* Popular Exhibitions */}
      <section className="mb-16 animate-fade-in-delay-3">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Populære utstillinger</h2>
          <Link href="/exhibitions?sort=popularity" className="text-rose-500 hover:text-rose-600 font-medium transition-colors">
            Vis alle →
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
      <section className="mb-16 animate-fade-in-delay-4">
        <h2 className="text-3xl font-bold text-gray-800 text-center mb-10">Hvorfor velge Reconnoitering?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center card-hover">
            <div className="text-5xl mb-4">🗓️</div>
            <h3 className="text-xl font-bold mb-3">Søk etter dato</h3>
            <p className="text-gray-600">
              Finn utstillinger som passer med din reiseplan, så du aldri går glipp av en mulighet.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center card-hover">
            <div className="text-5xl mb-4">🌍</div>
            <h3 className="text-xl font-bold mb-3">Utforsk etter sted</h3>
            <p className="text-gray-600">
              Oppdag utstillinger i din destinasjonsby eller innenfor en bestemt radius.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 text-center card-hover">
            <div className="text-5xl mb-4">🎨</div>
            <h3 className="text-xl font-bold mb-3">Filtrer etter interesse</h3>
            <p className="text-gray-600">
              Fokuser på kunststilene, kunstnerne og temaene som interesserer deg mest.
            </p>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="text-center py-16 bg-gradient-to-r from-rose-100 to-indigo-100 rounded-2xl animate-fade-in-delay-5">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Klar til å oppdage din neste kunstopplevelse?</h2>
        <p className="text-xl text-gray-600 mb-8">Bli med tusenvis av kunstelskere som bruker Reconnoitering</p>
        <Link 
          href="/auth/signup" 
          className="btn-primary inline-block text-lg"
        >
          Kom i gang gratis
        </Link>
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