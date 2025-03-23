import Link from 'next/link';
import Header from '@/components/Header';
import ExhibitionCard from '@/components/ExhibitionCard';
import VerticalCalendar from '@/components/VerticalCalendar';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';

async function getUpcomingExhibitions() {
  await dbConnect();
  const today = new Date();
  const exhibitions = await Exhibition.find({
    startDate: { $gte: today }
  })
  .sort({ startDate: 1 })
  .limit(6)
  .lean();
  
  return JSON.parse(JSON.stringify(exhibitions));
}

async function getPopularExhibitions() {
  await dbConnect();
  const exhibitions = await Exhibition.find({})
  .sort({ popularity: -1 })
  .limit(6)
  .lean();
  
  return JSON.parse(JSON.stringify(exhibitions));
}

export default async function Home() {
  const upcomingExhibitions = await getUpcomingExhibitions();
  const popularExhibitions = await getPopularExhibitions();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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