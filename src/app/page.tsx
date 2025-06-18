'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '@/components/Header';
import ExhibitionCard from '@/components/ExhibitionCard';
import VerticalCalendar from '@/components/VerticalCalendar';
import { ArrowRight, MapPin, Calendar, Search } from 'lucide-react';

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
        const upcomingRes = await fetch('/api/exhibitions?sort=startDate&limit=6&upcoming=true');
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
            const recommendedRes = await fetch('/api/recommendation');
            const recommendedData = await recommendedRes.json();
            if (recommendedData.success) {
              setRecommendedExhibitions(recommendedData.data || []);
            }
          } catch (error) {
            console.error('Failed to fetch recommendations:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load exhibitions. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section - Tate-inspired minimal hero */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/90 z-10"></div>
        
        {/* Background image from featured exhibition */}
        {popularExhibitions[0]?.coverImage && (
          <div className="absolute inset-0">
            <img 
              src={popularExhibitions[0].coverImage} 
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="relative z-20 text-center container-narrow">
          <h1 className="display-text mb-6 animate-fade-in">
            Discover Art
            <br />
            <span className="text-[var(--secondary)]">Exhibitions</span>
          </h1>
          <div className="accent-line mx-auto mb-8 animate-fade-in-delay"></div>
          <p className="text-lg text-[var(--text-muted)] mb-12 max-w-2xl mx-auto animate-fade-in-delay-2">
            Explore the world's most compelling art exhibitions, curated for the curious mind
          </p>
          
          {/* Search actions */}
          <div className="flex flex-wrap gap-4 justify-center animate-fade-in-delay-3">
            <Link href="/exhibitions" className="btn-primary">
              EXPLORE ALL EXHIBITIONS
            </Link>
            <Link href="/map" className="btn-secondary">
              VIEW ON MAP
            </Link>
          </div>
        </div>
      </section>

      {/* Quick Search Section */}
      <section className="py-12 border-y border-[var(--border)]">
        <div className="container-wide">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Link href="/nearby" className="group flex items-center gap-4 p-6 hover:bg-[var(--primary-light)] transition-colors">
              <MapPin className="w-8 h-8 text-[var(--secondary)]" />
              <div className="text-left">
                <h3 className="font-semibold text-lg group-hover:underline">Near You</h3>
                <p className="text-[var(--text-muted)]">Find exhibitions in your area</p>
              </div>
            </Link>
            
            <Link href="/calendar" className="group flex items-center gap-4 p-6 hover:bg-[var(--primary-light)] transition-colors">
              <Calendar className="w-8 h-8 text-[var(--secondary)]" />
              <div className="text-left">
                <h3 className="font-semibold text-lg group-hover:underline">This Week</h3>
                <p className="text-[var(--text-muted)]">What's on right now</p>
              </div>
            </Link>
            
            <Link href="/date-search" className="group flex items-center gap-4 p-6 hover:bg-[var(--primary-light)] transition-colors">
              <Search className="w-8 h-8 text-[var(--secondary)]" />
              <div className="text-left">
                <h3 className="font-semibold text-lg group-hover:underline">Plan Your Visit</h3>
                <p className="text-[var(--text-muted)]">Search by specific dates</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Exhibitions */}
      <section className="py-20">
        <div className="container-wide">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-4xl font-light mb-2">Opening Soon</h2>
              <div className="accent-line"></div>
            </div>
            <Link href="/exhibitions?sort=startDate" className="text-sm uppercase tracking-wider hover:text-[var(--secondary)] transition-colors flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {upcomingExhibitions.map((exhibition, index) => (
              <div key={exhibition._id} className="animate-fade-in-delay" style={{ animationDelay: `${index * 0.1}s` }}>
                <ExhibitionCard exhibition={exhibition} minimal />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section with Calendar */}
      <section className="py-20 bg-[var(--primary-light)]">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="text-4xl font-light mb-2">Popular Now</h2>
              <div className="accent-line mb-12"></div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {popularExhibitions.slice(0, 4).map((exhibition, index) => (
                  <div key={exhibition._id} className="animate-fade-in-delay" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ExhibitionCard exhibition={exhibition} minimal />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-2xl font-light mb-6">Calendar View</h3>
              <div className="bg-white p-6 border border-[var(--border)]">
                <VerticalCalendar />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      {session && recommendedExhibitions.length > 0 && (
        <section className="py-20">
          <div className="container-wide">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-light mb-2">Recommended for You</h2>
              <div className="accent-line mx-auto"></div>
              <p className="text-[var(--text-muted)] mt-4">Based on your preferences</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recommendedExhibitions.map((exhibition, index) => (
                <div key={exhibition._id} className="animate-fade-in-delay" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ExhibitionCard exhibition={exhibition} minimal />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-black text-white">
        <div className="container-narrow text-center">
          <h2 className="text-4xl font-light mb-6">Start Your Art Journey</h2>
          <p className="text-lg mb-8 opacity-80">
            Join thousands discovering extraordinary exhibitions worldwide
          </p>
          {!session ? (
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register" className="btn-secondary bg-white text-black border-white hover:bg-transparent hover:text-white">
                CREATE ACCOUNT
              </Link>
              <Link href="/auth/login" className="btn-secondary border-white text-white hover:bg-white hover:text-black">
                SIGN IN
              </Link>
            </div>
          ) : (
            <Link href="/account/preferences" className="btn-secondary bg-white text-black border-white hover:bg-transparent hover:text-white">
              SET YOUR PREFERENCES
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  return (
    <>
      <Header />
      <HomeContent />
    </>
  );
}