'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Exhibition {
  _id: string;
  title: string;
  location: {
    city: string;
    country: string;
  };
  startDate: string;
  endDate: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    
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
    
    if (status === 'authenticated') {
      fetchExhibitions();
    }
  }, [status, router]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this exhibition?')) {
      try {
        const response = await fetch(`/api/exhibitions/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete exhibition');
        }
        
        // Refresh the list
        setExhibitions(exhibitions.filter(ex => ex._id !== id));
      } catch (error) {
        console.error('Error deleting exhibition:', error);
        alert('Error deleting exhibition. Please try again.');
      }
    }
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
                <Link href="/admin/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 bg-gray-100">
                  Dashboard
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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Manage Exhibitions</h1>
          <Link 
            href="/admin/exhibitions/new" 
            className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded"
          >
            Add New Exhibition
          </Link>
        </div>
        
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {exhibitions.map((exhibition) => (
                <tr key={exhibition._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {exhibition.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {exhibition.location.city}, {exhibition.location.country}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {formatDate(exhibition.startDate)} - {formatDate(exhibition.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      href={`/admin/exhibitions/edit/${exhibition._id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(exhibition._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              
              {exhibitions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No exhibitions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}