// src/app/admin/exhibitions/new/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import GoogleMap from '@/components/GoogleMap';

export default function AddExhibition() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if location was passed from update tracker
  const locationFromParam = searchParams.get('location');
  
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
      name: locationFromParam || '',
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
    popularity: 0,
    closedDay: '' // New field for weekly closing day
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [additionalImages, setAdditionalImages] = useState<string[]>([]);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 48.8566, lng: 2.3522 }); // Default to Paris
  const [showMap, setShowMap] = useState(false);
  
  // Handle form field changes
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
  
  // Handle array field changes (comma-separated values)
  const handleArrayChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      [field]: value.split(',').map(item => item.trim())
    });
  };
  
  // Handle cover image change
  const handleCoverImageChange = (imageUrl: string) => {
    setFormData({
      ...formData,
      coverImage: imageUrl
    });
  };
  
  // Handle additional image addition
  const handleAddImage = (imageUrl: string) => {
    setAdditionalImages([...additionalImages, imageUrl]);
    setFormData({
      ...formData,
      images: [...additionalImages, imageUrl]
    });
  };
  
  // Handle additional image removal
  const handleRemoveAdditionalImage = (index: number) => {
    const updatedImages = [...additionalImages];
    updatedImages.splice(index, 1);
    setAdditionalImages(updatedImages);
    setFormData({
      ...formData,
      images: updatedImages
    });
  };
  
  // Show the map
  const handleShowMap = () => {
    setShowMap(true);
    
    // If coordinates are already set, center the map on them
    if (formData.location.coordinates.lat && formData.location.coordinates.lng) {
      setMapCenter({
        lat: parseFloat(formData.location.coordinates.lat as string),
        lng: parseFloat(formData.location.coordinates.lng as string)
      });
    }
    
    // If city is set, try to geocode it
    else if (formData.location.city) {
      const geocoder = new google.maps.Geocoder();
      const address = `${formData.location.city}, ${formData.location.country}`;
      
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const location = results[0].geometry.location;
          const newCenter = {
            lat: location.lat(),
            lng: location.lng()
          };
          
          setMapCenter(newCenter);
          
          // Update form coordinates
          setFormData({
            ...formData,
            location: {
              ...formData.location,
              coordinates: {
                lat: newCenter.lat.toString(),
                lng: newCenter.lng.toString()
              }
            }
          });
        }
      });
    }
  };
  
  // Handle map click to set coordinates
  const handleMapClick = (location: { lat: number; lng: number }) => {
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        coordinates: {
          lat: location.lat.toString(),
          lng: location.lng.toString()
        }
      }
    });
  };
  
  // Handle place selection from the map search box
  const handlePlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry || !place.geometry.location) return;
    
    const newLocation = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng()
    };
    
    // Extract address components
    let city = '';
    let country = '';
    let address = place.formatted_address || '';
    
    if (place.address_components) {
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        }
      });
    }
    
    // Update form data
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        address: address || formData.location.address,
        city: city || formData.location.city,
        country: country || formData.location.country,
        coordinates: {
          lat: newLocation.lat.toString(),
          lng: newLocation.lng.toString()
        }
      }
    });
    
    // Update map center
    setMapCenter(newLocation);
  };
  
  // Helper to get current coordinates from browser
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
          
          setMapCenter({ lat: latitude, lng: longitude });
          setShowMap(true);
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
  
  // Form submission
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
                
                <ImageUpload
                  initialImage={formData.coverImage}
                  onImageChange={handleCoverImageChange}
                  label="Cover Image *"
                  required={true}
                />
                
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
                
                <div>
                  <label htmlFor="closedDay" className="block text-sm font-medium text-gray-700 mb-1">
                    Weekly Closing Day
                  </label>
                  <select
                    id="closedDay"
                    name="closedDay"
                    value={formData.closedDay}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Open Every Day</option>
                    <option value="Monday">Closed Mondays</option>
                    <option value="Tuesday">Closed Tuesdays</option>
                    <option value="Wednesday">Closed Wednesdays</option>
                    <option value="Thursday">Closed Thursdays</option>
                    <option value="Friday">Closed Fridays</option>
                    <option value="Saturday">Closed Saturdays</option>
                    <option value="Sunday">Closed Sundays</option>
                  </select>
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
                      Location on Map
                    </label>
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleGetLocation}
                        className="text-xs bg-gray-200 hover:bg-gray-300 rounded px-2 py-1 text-gray-700"
                      >
                        Get My Location
                      </button>
                      <button
                        type="button"
                        onClick={handleShowMap}
                        className="text-xs bg-gray-200 hover:bg-gray-300 rounded px-2 py-1 text-gray-700"
                      >
                        {showMap ? 'Update Map' : 'Show Map'}
                      </button>
                    </div>
                  </div>
                  
                  {showMap ? (
                    <div className="h-96 rounded-lg overflow-hidden mb-4">
                      <GoogleMap
                        apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}
                        center={mapCenter}
                        zoom={14}
                        markers={formData.location.coordinates.lat && formData.location.coordinates.lng ? [
                          {
                            id: 'venue',
                            position: {
                              lat: parseFloat(formData.location.coordinates.lat as string),
                              lng: parseFloat(formData.location.coordinates.lng as string)
                            },
                            title: formData.location.name || 'Selected Location'
                          }
                        ] : []}
                        onClick={handleMapClick}
                        showSearchBox={true}
                        onPlaceSelected={handlePlaceSelected}
                        height="384px"
                      />
                    </div>
                  ) : (
                    <div 
                      className="h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4 cursor-pointer"
                      onClick={handleShowMap}
                    >
                      <div className="text-center text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        <p>Click to show map</p>
                      </div>
                    </div>
                  )}
                  
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
                  <p className="mt-1 text-xs text-gray-500">
                    These coordinates are needed for the map view and nearby exhibitions feature. You can set them using the map above.
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