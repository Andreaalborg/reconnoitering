// src/app/venues/[id]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Venue from '@/models/Venue';
import Exhibition from '@/models/Exhibition';

interface VenuePageProps {
  params: {
    id: string;
  };
}

// Helper function to get the day name
const getDayName = () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date().getDay()];
};

// Helper function to check if venue is closed today
const isClosedToday = (closedDays: string[] = []): boolean => {
  const today = getDayName();
  return closedDays.includes(today);
};

// Helper function to format date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
};

export default async function VenuePage({ params }: VenuePageProps) {
  await dbConnect();
  
  try {
    const venue = await Venue.findById(params.id).lean();
    
    if (!venue || !venue.isActive) {
      notFound();
    }

    // Fetch current and upcoming exhibitions
    const today = new Date();
    const exhibitions = await Exhibition.find({
      venue: params.id,
      endDate: { $gte: today }
    })
    .sort({ startDate: 1 })
    .populate('tags')
    .populate('artists')
    .lean();

    const currentExhibitions = exhibitions.filter(
      ex => new Date(ex.startDate) <= today && new Date(ex.endDate) >= today
    );
    const upcomingExhibitions = exhibitions.filter(
      ex => new Date(ex.startDate) > today
    );

    const isClosed = isClosedToday(venue.defaultClosedDays);

    return (
      <main className="container-wide py-8">
        <Link 
          href="/map" 
          className="inline-flex items-center text-rose-500 hover:text-rose-600 mb-6"
        >
          ← Back to map
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-serif mb-4">{venue.name}</h1>
            
            {isClosed && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                <strong>Note:</strong> This venue is closed on {getDayName()}s
              </div>
            )}

            <div className="card-minimal mb-6">
              <h2 className="text-xl font-semibold mb-4">Venue Information</h2>
              <dl className="grid gap-3">
                <div>
                  <dt className="font-medium text-gray-600">Address</dt>
                  <dd className="mt-1">
                    {venue.address && <div>{venue.address}</div>}
                    <div>{venue.city}, {venue.country} {venue.postalCode}</div>
                  </dd>
                </div>
                
                {venue.websiteUrl && (
                  <div>
                    <dt className="font-medium text-gray-600">Website</dt>
                    <dd className="mt-1">
                      <a 
                        href={venue.websiteUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-rose-500 hover:underline"
                      >
                        {venue.websiteUrl}
                      </a>
                    </dd>
                  </div>
                )}
                
                {venue.defaultClosedDays && venue.defaultClosedDays.length > 0 && (
                  <div>
                    <dt className="font-medium text-gray-600">Closed Days</dt>
                    <dd className="mt-1">
                      {venue.defaultClosedDays.join(', ')}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {currentExhibitions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-serif mb-4">Current Exhibitions</h2>
                <div className="grid gap-4">
                  {currentExhibitions.map((exhibition: any) => (
                    <Link 
                      key={exhibition._id}
                      href={`/exhibitions/${exhibition._id}`}
                      className="card-minimal hover-lift"
                    >
                      <h3 className="text-lg font-semibold mb-2">{exhibition.title}</h3>
                      {exhibition.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {exhibition.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-500">
                        {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                      </div>
                      {exhibition.tags && exhibition.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {exhibition.tags.map((tag: any) => (
                            <span 
                              key={tag._id}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {upcomingExhibitions.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif mb-4">Upcoming Exhibitions</h2>
                <div className="grid gap-4">
                  {upcomingExhibitions.map((exhibition: any) => (
                    <Link 
                      key={exhibition._id}
                      href={`/exhibitions/${exhibition._id}`}
                      className="card-minimal hover-lift opacity-75"
                    >
                      <h3 className="text-lg font-semibold mb-2">{exhibition.title}</h3>
                      {exhibition.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {exhibition.description}
                        </p>
                      )}
                      <div className="text-sm text-gray-500">
                        Starts {formatDate(exhibition.startDate)}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {currentExhibitions.length === 0 && upcomingExhibitions.length === 0 && (
              <div className="card-minimal text-center py-8 text-gray-500">
                No exhibitions currently scheduled at this venue.
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            {venue.coordinates && (
              <div className="card-minimal">
                <h3 className="text-lg font-semibold mb-4">Location</h3>
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <iframe
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&q=${venue.coordinates.lat},${venue.coordinates.lng}&zoom=15`}
                    allowFullScreen
                  />
                </div>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${venue.coordinates.lat},${venue.coordinates.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary w-full mt-4 text-center"
                >
                  Get Directions
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    );
  } catch (error) {
    console.error('Error loading venue:', error);
    notFound();
  }
}