// src/app/admin/update-tracker/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Museum {
  locationName: string;
  lastUpdated: string;
  city: string;
  country: string;
  exhibitionCount: number;
  daysSinceUpdate: number;
}

function UpdateTrackerContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [museums, setMuseums] = useState<Museum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterDays, setFilterDays] = useState<number | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'daysSinceUpdate' | 'locationName' | 'exhibitionCount'>('daysSinceUpdate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
      return;
    }
    
    if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }
    
    if (status === 'authenticated') {
      fetchUpdateStatus();
    }
  }, [status, session, router]);
  
  const fetchUpdateStatus = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/update-tracker');
      
      if (!response.ok) {
        throw new Error('Failed to fetch update status');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMuseums(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch update status');
      }
    } catch (err: any) {
      console.error('Error fetching update status:', err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  // Filter museums based on search term and days filter
  const filteredMuseums = museums.filter(museum => {
    // Apply search filter
    const matchesSearch = searchTerm === '' ||
      museum.locationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      museum.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      museum.country.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply days filter
    const matchesDays = filterDays === '' || museum.daysSinceUpdate >= Number(filterDays);
    
    return matchesSearch && matchesDays;
  });
  
  // Sort museums
  const sortedMuseums = [...filteredMuseums].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'locationName':
        comparison = a.locationName.localeCompare(b.locationName);
        break;
      case 'exhibitionCount':
        comparison = a.exhibitionCount - b.exhibitionCount;
        break;
      case 'daysSinceUpdate':
      default:
        comparison = a.daysSinceUpdate - b.daysSinceUpdate;
        break;
    }
    
    return sortOrder === 'desc' ? -comparison : comparison;
  });
  
  const toggleSortOrder = (field: 'daysSinceUpdate' | 'locationName' | 'exhibitionCount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };
  
  // Format last updated date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get color class based on days since update
  const getStatusColorClass = (days: number) => {
    if (days < 7) return 'bg-green-100 text-green-800'; // Updated in the last week
    if (days < 14) return 'bg-yellow-100 text-yellow-800'; // Updated in the last two weeks
    if (days < 30) return 'bg-orange-100 text-orange-800'; // Updated in the last month
    return 'bg-red-100 text-red-800'; // Not updated in over a month
  };
  
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
                <Link href="/admin/analytics" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Analytics
                </Link>
                <Link href="/admin/update-tracker" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 bg-gray-100">
                  Update Tracker
                </Link>
                <Link href="/admin/exhibitions/new" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Add Exhibition
                </Link>
              </div>
            </div>
            <div className="flex items-center">
              <div className="text-gray-700 mr-4">
                {session?.user?.name || 'Admin'}
              </div>
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Museum Update Tracker</h1>
          
          <button
            onClick={fetchUpdateStatus}
            className="bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600 transition-colors"
          >
            Refresh Data
          </button>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search museums
                </label>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name, city or country..."
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              
              <div>
                <label htmlFor="filterDays" className="block text-sm font-medium text-gray-700 mb-1">
                  Filter by days since update
                </label>
                <select
                  id="filterDays"
                  value={filterDays}
                  onChange={(e) => setFilterDays(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">All museums</option>
                  <option value="7">Not updated in 7+ days</option>
                  <option value="14">Not updated in 14+ days</option>
                  <option value="30">Not updated in 30+ days</option>
                  <option value="60">Not updated in 60+ days</option>
                </select>
              </div>
            </div>
            
            <div className="text-gray-600 text-sm">
              Found {filteredMuseums.length} museums.
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortOrder('locationName')}
                  >
                    <div className="flex items-center">
                      Museum Name
                      {sortBy === 'locationName' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortOrder('exhibitionCount')}
                  >
                    <div className="flex items-center">
                      Exhibitions
                      {sortBy === 'exhibitionCount' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => toggleSortOrder('daysSinceUpdate')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortBy === 'daysSinceUpdate' && (
                        <span className="ml-1">
                          {sortOrder === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedMuseums.map((museum, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {museum.locationName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {museum.city}, {museum.country}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {museum.exhibitionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(museum.lastUpdated)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColorClass(museum.daysSinceUpdate)}`}>
                        {Math.floor(museum.daysSinceUpdate)} days ago
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/exhibitions/new?location=${encodeURIComponent(museum.locationName)}`}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Add Exhibition
                      </Link>
                      <Link
                        href={`/admin/search?q=${encodeURIComponent(museum.locationName)}`}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View Exhibitions
                      </Link>
                    </td>
                  </tr>
                ))}
                
                {sortedMuseums.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No museums found matching your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p><span className="inline-block w-3 h-3 rounded-full bg-green-100 mr-1"></span> Updated in the last 7 days</p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-yellow-100 mr-1"></span> Updated in the last 14 days</p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-orange-100 mr-1"></span> Updated in the last 30 days</p>
              <p><span className="inline-block w-3 h-3 rounded-full bg-red-100 mr-1"></span> Not updated in over 30 days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpdateTrackerPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <UpdateTrackerContent />
    </Suspense>
  );
}