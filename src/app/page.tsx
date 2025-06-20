'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import ExhibitionCard from '@/components/ExhibitionCard';
import ExhibitionCardSkeleton from '@/components/ExhibitionCardSkeleton';
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
  coverImage?: string;
  imageUrl?: string;
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
        const upcomingRes = await fetch('/api/exhibitions?sort=startDate&limit=4&upcoming=true');
        const upcomingData = await upcomingRes.json();
        
        // Fetch popular exhibitions
        const popularRes = await fetch('/api/exhibitions?sort=-popularity&limit=8');
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
      <main className="min-h-screen bg-white">
        {/* Hero Section Skeleton */}
        <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gray-200 animate-pulse"></div>
          <div className="relative z-20 text-center container-narrow py-20">
            <div className="h-16 bg-gray-300 rounded w-64 mx-auto mb-6 animate-pulse" />
            <div className="h-6 bg-gray-300 rounded w-96 mx-auto mb-8 animate-pulse" />
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <div className="h-12 bg-gray-300 rounded w-48 animate-pulse" />
              <div className="h-12 bg-gray-300 rounded w-36 animate-pulse" />
            </div>
          </div>
        </section>

        {/* Quick Search Section Skeleton */}
        <section className="py-8 sm:py-12 border-y border-[var(--border)]">
          <div className="container-wide">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 sm:p-6 border-b sm:border-b-0 border-[var(--border)]">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                  <div>
                    <div className="h-5 bg-gray-200 rounded w-24 mb-2 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Upcoming Exhibitions Skeleton */}
        <section className="py-12 sm:py-20">
          <div className="container-wide">
            <div className="flex justify-between items-end mb-8 sm:mb-12">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse" />
                <div className="h-1 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <ExhibitionCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
      </main>
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
      <section className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-white/90 z-10"></div>
        
        {/* Background image - Munch Museum artwork */}
        <div className="absolute inset-0">
          <img 
            src="https://www.munchmuseet.no/globalassets/foto-utstillinger/2025/livsblod/mm.g.00203-05.jpg?w=1920&h=900&mode=Crop&quality=80&crop=0,448,2917,1815" 
            alt="Artwork from Munch Museum"
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>
        
        <div className="relative z-20 text-center container-narrow py-20">
          <h1 className="display-text mb-4 sm:mb-6 animate-fade-in text-white mix-blend-difference">
            Discover Art
            <br className="hidden sm:block" />
            <span className="text-[var(--secondary)] block sm:inline">Exhibitions</span>
          </h1>
          <div className="accent-line mx-auto mb-6 sm:mb-8 animate-fade-in-delay bg-white"></div>
          <p className="text-base sm:text-lg text-white mix-blend-difference mb-8 sm:mb-12 max-w-2xl mx-auto animate-fade-in-delay-2 px-4">
            Explore the world's most compelling art exhibitions, curated for the curious mind
          </p>
          
          {/* Search actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-delay-3 px-4">
            <Link href="/exhibitions" className="btn-primary">
              EXPLORE ALL EXHIBITIONS
            </Link>
            <Link href="/map" className="btn-secondary">
              VIEW ON MAP
            </Link>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce hidden sm:block">
          <svg className="w-6 h-6 text-white mix-blend-difference" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Quick Search Section */}
      <section className="py-8 sm:py-12 border-y border-[var(--border)]">
        <div className="container-wide">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:gap-8">
            <Link href="/nearby" className="group flex items-center gap-4 p-4 sm:p-6 hover:bg-[var(--primary-light)] transition-colors border-b sm:border-b-0 border-[var(--border)]">
              <MapPin className="w-6 sm:w-8 h-6 sm:h-8 text-[var(--secondary)] flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-base sm:text-lg group-hover:underline">Near You</h3>
                <p className="text-sm text-[var(--text-muted)]">Find exhibitions in your area</p>
              </div>
            </Link>
            
            <Link href="/calendar" className="group flex items-center gap-4 p-4 sm:p-6 hover:bg-[var(--primary-light)] transition-colors border-b sm:border-b-0 border-[var(--border)]">
              <Calendar className="w-6 sm:w-8 h-6 sm:h-8 text-[var(--secondary)] flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-base sm:text-lg group-hover:underline">This Week</h3>
                <p className="text-sm text-[var(--text-muted)]">What's on right now</p>
              </div>
            </Link>
            
            <Link href="/date-search" className="group flex items-center gap-4 p-4 sm:p-6 hover:bg-[var(--primary-light)] transition-colors">
              <Search className="w-6 sm:w-8 h-6 sm:h-8 text-[var(--secondary)] flex-shrink-0" />
              <div className="text-left">
                <h3 className="font-semibold text-base sm:text-lg group-hover:underline">Plan Your Visit</h3>
                <p className="text-sm text-[var(--text-muted)]">Search by specific dates</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Exhibitions */}
      <section className="py-12 sm:py-20">
        <div className="container-wide">
          <div className="flex justify-between items-end mb-8 sm:mb-12">
            <div>
              <h2 className="text-2xl sm:text-4xl font-serif mb-2">Opening Soon</h2>
              <div className="accent-line"></div>
            </div>
            <Link href="/exhibitions?sort=startDate" className="text-xs sm:text-sm uppercase tracking-wider hover:text-[var(--secondary)] transition-colors flex items-center gap-1 sm:gap-2">
              <span className="hidden sm:inline">View All</span>
              <span className="sm:hidden">All</span>
              <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {upcomingExhibitions.map((exhibition, index) => (
              <div key={exhibition._id} className="animate-fade-in-delay" style={{ animationDelay: `${index * 0.1}s` }}>
                <ExhibitionCard exhibition={exhibition} minimal />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section with Calendar */}
      <section className="py-12 sm:py-20 bg-[var(--primary-light)]">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              <h2 className="text-2xl sm:text-4xl font-serif mb-2">Popular Now</h2>
              <div className="accent-line mb-8 sm:mb-12"></div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                {popularExhibitions.slice(0, 4).map((exhibition, index) => (
                  <div key={exhibition._id} className="animate-fade-in-delay" style={{ animationDelay: `${index * 0.1}s` }}>
                    <ExhibitionCard exhibition={exhibition} minimal />
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-8 lg:mt-0">
              <h3 className="text-xl sm:text-2xl font-serif mb-4 sm:mb-6">Calendar View</h3>
              <div className="bg-white p-4 sm:p-6 border border-[var(--border)] rounded-lg">
                <VerticalCalendar />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations - Now part of main content flow */}
      {session && recommendedExhibitions.length > 0 && (
        <section className="py-12 sm:py-20 bg-gradient-to-b from-white to-[var(--primary-light)]">
          <div className="container-wide">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
              <div>
                <h2 className="text-2xl sm:text-4xl font-serif mb-2">Curated for You</h2>
                <div className="accent-line"></div>
                <p className="text-sm sm:text-base text-[var(--text-muted)] mt-2">Based on your art preferences</p>
              </div>
              <Link href="/account/preferences" className="text-xs sm:text-sm uppercase tracking-wider hover:text-[var(--secondary)] transition-colors flex items-center gap-1 sm:gap-2">
                <span className="hidden sm:inline">Update Preferences</span>
                <span className="sm:hidden">Preferences</span>
                <ArrowRight className="w-3 sm:w-4 h-3 sm:h-4" />
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {recommendedExhibitions.slice(0, 4).map((exhibition, index) => (
                <div key={exhibition._id} className="animate-fade-in-delay" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ExhibitionCard exhibition={exhibition} minimal />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Blog/Articles Section */}
      <section className="py-12 sm:py-20">
        <div className="container-wide">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-3xl sm:text-4xl font-light mb-2">Art Insights</h2>
              <div className="accent-line"></div>
              <p className="text-[var(--text-muted)] mt-2">Expert perspectives on the art world</p>
            </div>
            <Link href="/blog" className="text-sm uppercase tracking-wider hover:text-[var(--secondary)] transition-colors flex items-center gap-2">
              All Articles <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Article 1 */}
            <article className="group">
              <Link href="/blog/contemporary-art-trends">
                <div className="aspect-[16/9] bg-[var(--primary-light)] rounded-lg mb-4 overflow-hidden">
                  {/* Placeholder for article image */}
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    Article Image
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[var(--text-muted)]">December 15, 2024</p>
                  <h3 className="text-xl font-serif group-hover:text-[var(--secondary)] transition-colors">
                    Contemporary Art Trends Shaping 2025
                  </h3>
                  <p className="text-[var(--text-muted)] line-clamp-3">
                    Explore the emerging movements and artistic expressions that are defining the contemporary art landscape this year.
                  </p>
                </div>
              </Link>
            </article>

            {/* Article 2 */}
            <article className="group">
              <Link href="/blog/museum-technology">
                <div className="aspect-[16/9] bg-[var(--primary-light)] rounded-lg mb-4 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    Article Image
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[var(--text-muted)]">December 10, 2024</p>
                  <h3 className="text-xl font-serif group-hover:text-[var(--secondary)] transition-colors">
                    How Museums Are Embracing Digital Innovation
                  </h3>
                  <p className="text-[var(--text-muted)] line-clamp-3">
                    From virtual reality tours to NFT collections, discover how technology is transforming the museum experience.
                  </p>
                </div>
              </Link>
            </article>

            {/* Article 3 */}
            <article className="group">
              <Link href="/blog/art-collectors-guide">
                <div className="aspect-[16/9] bg-[var(--primary-light)] rounded-lg mb-4 overflow-hidden">
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    Article Image
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[var(--text-muted)]">December 5, 2024</p>
                  <h3 className="text-xl font-serif group-hover:text-[var(--secondary)] transition-colors">
                    A Beginner's Guide to Art Collecting
                  </h3>
                  <p className="text-[var(--text-muted)] line-clamp-3">
                    Essential tips and insights for those looking to start their own art collection, from galleries to auctions.
                  </p>
                </div>
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--secondary)] text-white">
        <div className="container-narrow text-center">
          <h2 className="text-4xl font-light mb-6">Start Your Art Journey</h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands discovering extraordinary exhibitions worldwide
          </p>
          {!session ? (
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register" className="btn-secondary bg-white text-[var(--secondary)] border-white hover:bg-transparent hover:text-white">
                CREATE ACCOUNT
              </Link>
              <Link href="/auth/login" className="btn-secondary border-white text-white hover:bg-white hover:text-[var(--secondary)]">
                SIGN IN
              </Link>
            </div>
          ) : (
            <Link href="/account/preferences" className="btn-secondary bg-white text-[var(--secondary)] border-white hover:bg-transparent hover:text-white">
              SET YOUR PREFERENCES
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}

export default function HomePage() {
  return <HomeContent />;
}