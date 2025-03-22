'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ExhibitionData {
  _id: string;
  title: string;
  description: string;
  coverImage: string;
  startDate: string;
  endDate: string;
  location: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates: {
      lat: string | number;
      lng: string | number;
    };
  };
  category: string[];
  artists: string[];
  tags: string[];
  ticketPrice: string;
  ticketUrl: string;
  websiteUrl: string;
  popularity: number;
}

export default function EditExhibition({ params }: { params: { id: string } }) {
  const { status } = useSession();
  const router = useRouter();
  const { id } = params;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ExhibitionData | null>(null);
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
    
    const fetchExhibition = async () => {
      try {
        const response = await fetch(`/api/exhibitions/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch exhibition');
        }
        
        const data = await response.json();
        
        // Format dates for input fields (YYYY-MM-DD)
        const exhibition = data.data;
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        exhibition.startDate = formatDate(exhibition.startDate);
        exhibition.endDate = formatDate(exhibition.endDate);
        
        // Ensure coordinates are strings for inputs
        if (exhibition.location.coordinates) {
          exhibition.location.coordinates.lat = String(exhibition.location.coordinates.lat || '');
          exhibition.location.coordinates.lng = String(exhibition.location.coordinates.lng || '');
        } else {
          exhibition.location.coordinates = { lat: '', lng: '' };
        }
        
        setFormData(exhibition);
      } catch (error) {
        console.error('Error fetching exhibition:', error);
        setError('Failed to load exhibition data');
      } finally {
        setLoading(false);
      }
    };
    
    if (status === 'authenticated') {
      fetchExhibition();
    }
  }, [id, status, router]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!formData) return;
    
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent as keyof typeof formData],
            [child]: value,
          },
        });
      } else if (parts.length === 3) {
        const [parent, child, subchild] = parts;
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent as keyof typeof formData],
            [child]: {
              ...formData[parent as keyof typeof formData][child],
              [subchild]: value,
            },
          },
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof ExhibitionData) => {
    if (!formData) return;
    
    const { value } = e.target;
    setFormData({
      ...formData,
      [field]: value.split(',').map(item => item.trim()),
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;
    
    setSaving(true);
    setError('');
    
    try {
      const response = await fetch(`/api/exhibitions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update exhibition');
      }
      
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error updating exhibition:', error);
      setError('Failed to update exhibition. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!formData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-red-500">Failed to load exhibition data</div>
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
                <Link href="/admin/exhibitions/new" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Add Exhibition
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Exhibition</h1>
          <Link 
            href="/admin/dashboard" 
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Dashboard
          </Link>
        </div>
        
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        <div className="bg-white shadow-md rounded-lg p-6">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Image URL *
                  </label>
                  <input
                    type="url"
                    id="coverImage"
                    name="coverImage"
                    value={formData.coverImage}
                    onChange={handleChange}
                    required
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Use images from picsum.photos, unsplash.com, or other configured domains.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      id="startDate"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      id="endDate"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Location</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="location.name" className="block text-sm font-medium text-gray-700 mb-1">
                    Venue Name *
                  </label>
                  <input
                    type="text"
                    id="location.name"
                    name="location.name"
                    value={formData.location.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="location.address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="location.address"
                    name="location.address"
                    value={formData.location.address}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location.city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="location.city"
                      name="location.city"
                      value={formData.location.city}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location.country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="location.country"
                      name="location.country"
                      value={formData.location.country}
                      onChange={handleChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="location.coordinates.lat" className="block text-sm font-medium text-gray-700 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      id="location.coordinates.lat"
                      name="location.coordinates.lat"
                      value={formData.location.coordinates.lat}
                      onChange={handleChange}
                      placeholder="e.g. 51.5074"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="location.coordinates.lng" className="block text-sm font-medium text-gray-700 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      id="location.coordinates.lng"
                      name="location.coordinates.lng"
                      value={formData.location.coordinates.lng}
                      onChange={handleChange}
                      placeholder="e.g. -0.1278"
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Categories and Tags</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                    Categories (comma separated) *
                  </label>
                  <input
                    type="text"
                    id="category"
                    name="category"
                    value={formData.category.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'category')}
                    required
                    placeholder="Painting, Modern Art, Sculpture"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="artists" className="block text-sm font-medium text-gray-700 mb-1">
                    Artists (comma separated) *
                  </label>
                  <input
                    type="text"
                    id="artists"
                    name="artists"
                    value={formData.artists.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'artists')}
                    required
                    placeholder="Pablo Picasso, Claude Monet"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags.join(', ')}
                    onChange={(e) => handleArrayChange(e, 'tags')}
                    placeholder="contemporary, abstract, french"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label htmlFor="ticketPrice" className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket Price
                  </label>
                  <input
                    type="text"
                    id="ticketPrice"
                    name="ticketPrice"
                    value={formData.ticketPrice}
                    onChange={handleChange}
                    placeholder="e.g. $15, Free, £10-£20"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="ticketUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Ticket URL
                  </label>
                  <input
                    type="url"
                    id="ticketUrl"
                    name="ticketUrl"
                    value={formData.ticketUrl}
                    onChange={handleChange}
                    placeholder="https://example.com/tickets"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="websiteUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    id="websiteUrl"
                    name="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={handleChange}
                    placeholder="https://example.com"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="popularity" className="block text-sm font-medium text-gray-700 mb-1">
                    Popularity (0-100)
                  </label>
                  <input
                    type="number"
                    id="popularity"
                    name="popularity"
                    value={formData.popularity}
                    onChange={handleChange}
                    min="0"
                    max="100"
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Link
                href="/admin/dashboard"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded mr-2 hover:bg-gray-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="bg-rose-500 text-white px-4 py-2 rounded hover:bg-rose-600 disabled:bg-rose-300"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Exhibition'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}