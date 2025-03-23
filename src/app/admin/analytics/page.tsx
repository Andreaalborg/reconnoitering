'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Simple chart component for exhibition statistics
const BarChart = ({ data, title }: { data: { label: string; value: number }[], title: string }) => {
  const maxValue = Math.max(...data.map(item => item.value));
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm truncate" title={item.label}>{item.label}</div>
            <div className="relative flex-1 h-8">
              <div className="absolute inset-0 bg-gray-200 rounded"></div>
              <div 
                className="absolute inset-y-0 left-0 bg-rose-500 rounded"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              ></div>
              <div className="absolute inset-y-0 flex items-center pl-2 text-white font-medium">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalExhibitions: 0,
    activeExhibitions: 0,
    upcomingExhibitions: 0,
    pastExhibitions: 0,
    totalFavorites: 0,
    totalUsers: 0,
    exhibitionsByCity: [] as { label: string; value: number }[],
    exhibitionsByCategory: [] as { label: string; value: number }[],
    popularExhibitions: [] as { label: string; value: number }[]
  });
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    
    const fetchStats = async () => {
      try {
        // In a real app, you would fetch this data from an API
        // For now, we'll simulate with some example data
        
        // Simulated API response
        setTimeout(() => {
          setStats({
            totalExhibitions: 42,
            activeExhibitions: 18,
            upcomingExhibitions: 14,
            pastExhibitions: 10,
            totalFavorites: 156,
            totalUsers: 24,
            exhibitionsByCity: [
              { label: 'London', value: 12 },
              { label: 'Paris', value: 8 },
              { label: 'New York', value: 7 },
              { label: 'Tokyo', value: 5 },
              { label: 'Berlin', value: 4 }
            ],
            exhibitionsByCategory: [
              { label: 'Contemporary', value: 15 },
              { label: 'Painting', value: 12 },
              { label: 'Photography', value: 10 },
              { label: 'Sculpture', value: 8 },
              { label: 'Digital', value: 7 }
            ],
            popularExhibitions: [
              { label: 'Van Gogh: The Immersive Experience', value: 42 },
              { label: 'Modern Art Festival', value: 37 },
              { label: 'Photography Biennale', value: 29 },
              { label: 'Picasso Retrospective', value: 23 },
              { label: 'Digital Art Summit', value: 18 }
            ]
          });
          setLoading(false);
        }, 1000);
        
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      }
    };
    
    if (status === 'authenticated') {
      fetchStats();
    }
  }, [status, router]);
  
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
                <Link href="/admin/analytics" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 bg-gray-100">
                  Analytics
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Exhibitions</h2>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-semibold">{stats.totalExhibitions}</p>
              <p className="ml-2 text-sm text-gray-600">Total</p>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
              <div className="bg-green-100 p-2 rounded">
                <div className="font-semibold text-green-800">{stats.activeExhibitions}</div>
                <div className="text-green-600">Active</div>
              </div>
              <div className="bg-blue-100 p-2 rounded">
                <div className="font-semibold text-blue-800">{stats.upcomingExhibitions}</div>
                <div className="text-blue-600">Upcoming</div>
              </div>
              <div className="bg-gray-100 p-2 rounded">
                <div className="font-semibold text-gray-800">{stats.pastExhibitions}</div>
                <div className="text-gray-600">Past</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">User Activity</h2>
            <div className="mt-2 flex items-baseline">
              <p className="text-3xl font-semibold">{stats.totalUsers}</p>
              <p className="ml-2 text-sm text-gray-600">Users</p>
            </div>
            <div className="mt-4 bg-rose-100 p-2 rounded text-center">
              <div className="font-semibold text-rose-800">{stats.totalFavorites}</div>
              <div className="text-rose-600">Total Favorites</div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
            <div className="mt-4 space-y-3">
              <Link 
                href="/admin/exhibitions/new" 
                className="block w-full bg-rose-500 text-white text-center py-2 px-4 rounded hover:bg-rose-600"
              >
                Add New Exhibition
              </Link>
              <Link 
                href="/admin/dashboard" 
                className="block w-full bg-gray-200 text-gray-800 text-center py-2 px-4 rounded hover:bg-gray-300"
              >
                Manage Exhibitions
              </Link>
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <BarChart data={stats.exhibitionsByCity} title="Exhibitions by City" />
          <BarChart data={stats.exhibitionsByCategory} title="Exhibitions by Category" />
        </div>
        
        <div className="mb-8">
          <BarChart data={stats.popularExhibitions} title="Most Popular Exhibitions" />
        </div>
      </div>
    </div>
  );
}