'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload'; // Import the new component

export default function AddExhibition() {
  const { status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    images: [] as string[],
    startDate: '',
    endDate: '',
    location: {
      name: '',
      address: '',
      city: '',
      country: '',
      coordinates: {
        lat: '',
        lng: ''
      }
    },
    category: [] as string[],
    artists: [] as string[],
    tags: [] as string[],
    ticketPrice: '',
    ticketUrl: '',
    websiteUrl: '',
    popularity: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      if (parent === 'location' && child === 'coordinates') {
        const [, coord] = name.split('.');
        setFormData({
          ...formData,
          location: {
            ...formData.location,
            coordinates: {
              ...formData.location.coordinates,
              [coord]: value
            }
          }
        });
      } else {
        setFormData({
          ...formData,
          [parent]: {
            ...formData[parent as keyof typeof formData],
            [child]: value
          }
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      [field]: value.split(',').map(item => item.trim())
    });
  };
  
  const handleCoverImageChange = (imageUrl: string) => {
    setFormData({
      ...formData,
      coverImage: imageUrl
    });
  };
  
  const handleAddImage = (imageUrl: string) => {
    setAdditionalImages([...additionalImages, imageUrl]);
    setFormData({
      ...formData,
      images: [...additionalImages, imageUrl]
    });
  };
  
  const handleRemoveAdditionalImage = (index: number) => {
    const updatedImages = [...additionalImages];
    updatedImages.splice(index, 1);
    setAdditionalImages(updatedImages);
    setFormData({
      ...formData,
      images: updatedImages
    });
  };
  
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setFormData({
            ...formData,
            location: {
              ...formData.location,
              coordinates: {
                lat: latitude.toString(),
                lng: longitude.toString()
              }
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get your location. Please enter coordinates manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Validate required fields
    if (!formData.title || !formData.description || !formData.coverImage || 
        !formData.startDate || !formData.endDate || !formData.location.name || 
        !formData.location.city || !formData.location.country) {
      setError('Please fill all required fields');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/exhibitions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          images: additionalImages
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create exhibition');
      }
      
      router.push('/admin/dashboard');
    } catch (error) {
      console.error('Error creating exhibition:', error);
      setError('Failed to create exhibition. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading') {
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
                <Link href="/admin/exhibitions/new" className="px-3 py-2 rounded-md text-sm font-medium text-gray-900 bg-gray-100">
                  Add Exhibition
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Exhibition</h1>
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
                
                {/* Replace the old cover image input with the new ImageUpload component */}
                <ImageUpload
                  initialImage={formData.coverImage}
                  onImageChange={handleCoverImageChange}
                  label="Cover Image *"
                  required={true}
                />
                
                {/* Additional Images */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Additional Images (Optional)
                  </label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {additionalImages.map((img, index) => (
    <div key={index} className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
      {img && img.trim() !== '' ? (
        <Image 
          src={img} 
          alt={`Additional image ${index + 1}`} 
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 25vw"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-400 text-sm">Invalid image</span>
        </div>
      )}
      <button
        type="button"
        onClick={() => handleRemoveAdditionalImage(index)}
        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  ))}
                    
                    {/* Add new image button */}
                    <div className="h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                      <ImageUpload
                        onImageChange={handleAddImage}
                        label=""
                        required={false}
                      />
                    </div>
                  </div>
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
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Coordinates
                    </label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      className="text-xs bg-gray-200 hover:bg-gray-300 rounded px-2 py-1 text-gray-700"
                    >
                      Get My Location
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        id="location.coordinates.lat"
                        name="location.coordinates.lat"
                        value={formData.location.coordinates.lat}
                        onChange={handleChange}
                        placeholder="Latitude (e.g. 51.5074)"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    
                    <div>
                      <input
                        type="text"
                        id="location.coordinates.lng"
                        name="location.coordinates.lng"
                        value={formData.location.coordinates.lng}
                        onChange={handleChange}
                        placeholder="Longitude (e.g. -0.1278)"
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    These coordinates are needed for the map view and nearby exhibitions feature
                  </p>
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
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Exhibition'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}