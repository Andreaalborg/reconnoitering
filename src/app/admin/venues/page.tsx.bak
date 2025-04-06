'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, Fragment } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Legg til type for session
interface UserSession {
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

// Updated interface
interface VenueWithExhibitions {
  _id: string;
  name: string;
  city: string;
  country: string;
  isActive: boolean;
  lastUpdatedVenue?: string; // When the Venue itself was last updated
  exhibitions: { 
    _id: string;
    title: string;
    startDate: string;
    endDate: string;
    addedDate: string; // Need this from API now
  }[];
  exhibitionCount: number; 
  lastExhibitionAddedDate?: string; // Renamed from lastExhibitionEndDate
  pastExhibitionsCount?: number; // Renamed from pastExhibitionCount
}

export default function AdminVenues() {
  // Add this for client-side rendering only
  const [isMounted, setIsMounted] = useState(false);
  
  const { data: session, status } = useSession() as { data: UserSession | null, status: string };
  const router = useRouter();
  const [venues, setVenues] = useState<VenueWithExhibitions[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedVenueId, setExpandedVenueId] = useState<string | null>(null);
  
  useEffect(() => {
    setIsMounted(true);
    
    // Skip the rest during server rendering
    if (typeof window === 'undefined') return;
    
    if (status === 'unauthenticated') {
      console.log('Bruker er ikke autentisert');
      router.push('/admin/login');
      return;
    }
    
    if (status === 'authenticated') {
      console.log('Bruker er autentisert:', session?.user);
      if (session?.user?.role !== 'admin') {
        console.log('Bruker er ikke admin');
        router.push('/admin/login');
        return;
      }
    }
    
    const fetchVenues = async () => {
      setLoading(true);
      try {
        console.log('Henter venues...');
        const response = await fetch('/api/admin/venues');
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Kunne ikke hente venues');
        }
        const data = await response.json();
        console.log('Mottok venues:', data);
        if (data.success && Array.isArray(data.data)) {
          setVenues(data.data);
        } else {
          setVenues([]);
          console.warn("Mottok ugyldig data for venues", data);
        }
      } catch (error) {
        console.error('Error fetching venues:', error);
        alert('Kunne ikke hente venues. Vennligst sjekk at du er logget inn som admin.');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchVenues();
    }
  }, [status, session, router]);
  
  // Format date function (English)
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        // Check if date is valid before formatting
        if (isNaN(date.getTime())) return 'Invalid Date';
        return new Intl.DateTimeFormat('en-GB', { // Use GB for DD/MM/YYYY or US for MM/DD/YYYY
          year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        }).format(date);
    } catch (e) {
        console.error("Error formatting date:", dateString, e);
        return 'Invalid Date';
    }
  };
  
  // Format how long ago a date was (English)
  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return <span className="text-gray-400 italic">No exhibitions</span>;
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return <span className="text-red-500">Invalid date</span>;
        const now = new Date();
        const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
        const diffDays = Math.floor(diffSeconds / (60 * 60 * 24));

        let color = 'text-green-600';
        if (diffDays > 90) color = 'text-yellow-600';
        if (diffDays > 180) color = 'text-red-600';

        let timeAgo = `${diffDays} days ago`;
        if (diffDays < 1) timeAgo = 'Today';
        if (diffDays === 1) timeAgo = 'Yesterday';
        // Add more granular time later if needed (hours, weeks)

        return (
            <span className={color}> 
             {formatDate(dateString)} {/* Show the actual date */}
             <span className="text-xs text-gray-400 ml-1">({timeAgo})</span>
            </span>
        );
    } catch (e) {
        console.error("Error formatting time ago:", dateString, e);
        return <span className="text-red-500">Error</span>;
    }
  };
  
  const handleDeleteVenue = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this venue? If used by exhibitions, it will be marked as inactive instead.')) {
      try {
        const response = await fetch(`/api/admin/venues/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Kunne ikke slette venue');
        }
        
        const result = await response.json();
        
        if (result.message.includes('marked as inactive') || result.message.includes('markert som inaktivt')) {
          setVenues(venues.map(venue => 
            venue._id === id ? { ...venue, isActive: false } : venue
          ));
          alert('Venue is used by exhibitions and has been marked as inactive.');
        } else {
          setVenues(venues.filter(venue => venue._id !== id));
          alert('Venue deleted!');
        }
      } catch (error: any) {
        console.error('Error deleting venue:', error);
        alert(`Error deleting venue: ${error.message}`);
      }
    }
  };
  
  const handleDeleteExhibition = async (exhibitionId: string, venueId: string) => {
    if (window.confirm(`Are you sure you want to delete this exhibition?`)) {
      try {
        // Bruk admin API-ruten for å slette utstilling
        const response = await fetch(`/api/admin/exhibitions/${exhibitionId}`, { method: 'DELETE' });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Kunne ikke slette utstilling');
        }
        // Oppdater state: Fjern utstillingen fra den spesifikke venue's liste
        setVenues(venues.map(venue => {
          if (venue._id === venueId) {
            return {
              ...venue,
              exhibitions: venue.exhibitions.filter(ex => ex._id !== exhibitionId),
              exhibitionCount: venue.exhibitionCount - 1
            };
          }
          return venue;
        }));
        alert('Exhibition deleted!');
      } catch (error: any) {
        console.error('Error deleting exhibition:', error);
        alert(`Error deleting exhibition: ${error.message}`);
      }
    }
  };
  
  // Funksjon for å toggle visning av utstillinger
  const toggleExhibitions = (venueId: string) => {
    setExpandedVenueId(prevId => prevId === venueId ? null : venueId);
  };
  
  // During server rendering or build, return minimal content
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-100"></div>;
  }
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
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
                <Link href="/admin/venues" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 bg-gray-100">
                  Venues
                </Link>
                <Link href="/admin/exhibitions/new" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Add Exhibition
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              {session?.user?.name && <span className="text-gray-700 mr-4">{session.user.name}</span>}
              <button
                onClick={() => router.push('/api/auth/signout')}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Venues</h1>
          <Link 
            href="/admin/venues/new" 
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded"
          >
            Add New Venue
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-1 py-3 w-8"></th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Exh. Added
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Venue Updated
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                    Past Exh.
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-44">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {venues.map((venue) => (
                  <Fragment key={venue._id}>
                    <tr>
                      <td className="px-1 py-4 text-center">
                        {venue.exhibitionCount > 0 && (
                          <button 
                            onClick={() => toggleExhibitions(venue._id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded-full"
                            title={expandedVenueId === venue._id ? 'Skjul utstillinger' : 'Vis utstillinger'}
                          >
                            {expandedVenueId === venue._id ? (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path fillRule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                              </svg>
                            )}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {venue.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {venue.city}, {venue.country}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {formatTimeAgo(venue.lastExhibitionAddedDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {formatDate(venue.lastUpdatedVenue)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className={`text-sm ${venue.pastExhibitionsCount && venue.pastExhibitionsCount > 0 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                          {venue.pastExhibitionsCount ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${venue.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{venue.isActive ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap justify-end gap-2 text-sm font-medium">
                          <Link href={`/admin/exhibitions/new?venueId=${venue._id}`} className="text-green-600 hover:text-green-900" title="Add Exhibition">+ Exhibition</Link>
                          <Link href={`/admin/venues/${venue._id}/edit`} className="text-indigo-600 hover:text-indigo-900" title="Edit Venue">Edit</Link>
                          <button onClick={() => handleDeleteVenue(venue._id)} className="text-red-600 hover:text-red-900" title="Delete Venue">Delete</button>
                        </div>
                      </td>
                    </tr>
                    {expandedVenueId === venue._id && (
                      <tr>
                        <td></td>
                        <td colSpan={7} className="px-6 py-4 bg-gray-50">
                          <h4 className="text-sm font-semibold mb-3 text-gray-800 border-b pb-1">Exhibitions ({venue.exhibitionCount}):</h4>
                          {venue.exhibitions.length > 0 ? (
                            <ol className="list-decimal list-inside space-y-2">
                              {venue.exhibitions.map((ex, index) => (
                                <li key={ex._id} className="text-sm text-gray-700 flex justify-between items-center">
                                  <div>
                                    <span className="font-medium mr-2">{index + 1}.</span>
                                    <Link href={`/admin/exhibitions/edit/${ex._id}`} className="text-blue-600 hover:underline hover:text-blue-800">
                                      {ex.title} 
                                    </Link>
                                    <span className="text-xs text-gray-500 ml-2 block sm:inline">
                                      ({formatDate(ex.startDate)} - {formatDate(ex.endDate)})
                                    </span>
                                  </div>
                                  <div className="whitespace-nowrap">
                                    <Link href={`/admin/exhibitions/edit/${ex._id}`} className="text-indigo-600 hover:text-indigo-900 text-xs mr-3">
                                      Edit
                                    </Link>
                                    <button 
                                      onClick={() => handleDeleteExhibition(ex._id, venue._id)}
                                      className="text-red-600 hover:text-red-900 text-xs"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ol>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No exhibitions registered.</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
                
                {venues.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                      No venues found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 