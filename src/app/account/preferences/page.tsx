// src/app/account/preferences/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

interface Preferences {
  preferredCategories: string[];
  preferredArtists: string[];
  preferredLocations: string[];
  excludedCategories: string[];
  notificationFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

function PreferencesContent() {
  const { status } = useSession();
  const router = useRouter();
  
  const [preferences, setPreferences] = useState<Preferences>({
    preferredCategories: [],
    preferredArtists: [],
    preferredLocations: [],
    excludedCategories: [],
    notificationFrequency: 'weekly'
  });
  
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableArtists, setAvailableArtists] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // New categories and artists being added
  const [newCategory, setNewCategory] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newLocation, setNewLocation] = useState('');
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/account/preferences');
      return;
    }
    
    if (status === 'authenticated') {
      fetchPreferences();
      fetchOptions();
    }
  }, [status, router]);
  
  const fetchPreferences = async () => {
    try {
      const response = await fetch('/api/user/preferences');
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.data);
      } else {
        throw new Error(data.error || 'Failed to fetch preferences');
      }
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchOptions = async () => {
    try {
      // Fetch available categories, artists, and cities from exhibitions
      const response = await fetch('/api/exhibitions?limit=1');
      
      if (!response.ok) {
        throw new Error('Failed to fetch options');
      }
      
      const data = await response.json();
      
      if (data.success && data.meta && data.meta.filter_options) {
        setAvailableCategories(data.meta.filter_options.categories || []);
        setAvailableCities(data.meta.filter_options.cities || []);
        
        // For artists, we need to fetch them differently (not currently returned in filter_options)
        // This is a temporary workaround
        const sampleArtists = [
          'Pablo Picasso', 'Claude Monet', 'Vincent van Gogh', 'Salvador Dalí',
          'Frida Kahlo', 'Leonardo da Vinci', 'Rembrandt', 'Michelangelo',
          'Andy Warhol', 'Georgia O\'Keeffe', 'Jackson Pollock', 'Edvard Munch'
        ];
        setAvailableArtists(sampleArtists);
      }
    } catch (err: any) {
      console.error('Error fetching options:', err);
    }
  };
  
  const handlePreferenceChange = (
    type: keyof Preferences, 
    action: 'add' | 'remove', 
    value?: string
  ) => {
    if (type === 'notificationFrequency' && action === 'add' && value) {
      setPreferences({
        ...preferences,
        notificationFrequency: value as 'daily' | 'weekly' | 'monthly' | 'never'
      });
      return;
    }
    
    if (!value) return;
    
    setPreferences(prev => {
      const currentValues = [...(prev[type] || [])];
      
      if (action === 'add' && !currentValues.includes(value)) {
        return {
          ...prev,
          [type]: [...currentValues, value]
        };
      } else if (action === 'remove') {
        return {
          ...prev,
          [type]: currentValues.filter(v => v !== value)
        };
      }
      
      return prev;
    });
  };
  
  const handleAddPreference = (type: keyof Preferences) => {
    let value = '';
    
    switch (type) {
      case 'preferredCategories':
        value = newCategory;
        setNewCategory('');
        break;
      case 'preferredArtists':
        value = newArtist;
        setNewArtist('');
        break;
      case 'preferredLocations':
        value = newLocation;
        setNewLocation('');
        break;
      default:
        return;
    }
    
    if (value) {
      handlePreferenceChange(type, 'add', value);
    }
  };
  
  const savePreferences = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess('Preferences saved successfully!');
        setPreferences(data.data);
      } else {
        throw new Error(data.error || 'Failed to save preferences');
      }
    } catch (err: any) {
      console.error('Error saving preferences:', err);
      setError(err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
          </div>
        </main>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Preferences</h1>
        
        {error && (
          <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            {success}
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Favorite Categories</h2>
            <p className="text-gray-600 mb-4">
              Select the categories of art you're most interested in. Exhibitions in these categories will be prioritized in your recommendations.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {preferences.preferredCategories.map((category, index) => (
                <div 
                  key={index} 
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{category}</span>
                  <button
                    type="button"
                    onClick={() => handlePreferenceChange('preferredCategories', 'remove', category)}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {preferences.preferredCategories.length === 0 && (
                <div className="text-gray-500 italic">No categories selected</div>
              )}
            </div>
            
            <div className="flex">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select a category...</option>
                {availableCategories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleAddPreference('preferredCategories')}
                className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                disabled={!newCategory}
              >
                Add
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Favorite Artists</h2>
            <p className="text-gray-600 mb-4">
              Select the artists whose work you're most interested in. Exhibitions featuring these artists will be prioritized.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {preferences.preferredArtists.map((artist, index) => (
                <div 
                  key={index} 
                  className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{artist}</span>
                  <button
                    type="button"
                    onClick={() => handlePreferenceChange('preferredArtists', 'remove', artist)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {preferences.preferredArtists.length === 0 && (
                <div className="text-gray-500 italic">No artists selected</div>
              )}
            </div>
            
            <div className="flex">
              <select
                value={newArtist}
                onChange={(e) => setNewArtist(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select an artist...</option>
                {availableArtists.map((artist, index) => (
                  <option key={index} value={artist}>{artist}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleAddPreference('preferredArtists')}
                className="bg-purple-500 text-white px-4 py-2 rounded-r hover:bg-purple-600"
                disabled={!newArtist}
              >
                Add
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Preferred Locations</h2>
            <p className="text-gray-600 mb-4">
              Select the cities or countries you frequently visit or are interested in. Exhibitions in these locations will be highlighted.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {preferences.preferredLocations.map((location, index) => (
                <div 
                  key={index} 
                  className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{location}</span>
                  <button
                    type="button"
                    onClick={() => handlePreferenceChange('preferredLocations', 'remove', location)}
                    className="ml-2 text-green-600 hover:text-green-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {preferences.preferredLocations.length === 0 && (
                <div className="text-gray-500 italic">No locations selected</div>
              )}
            </div>
            
            <div className="flex">
              <select
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select a location...</option>
                {availableCities.map((city, index) => (
                  <option key={index} value={city}>{city}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleAddPreference('preferredLocations')}
                className="bg-green-500 text-white px-4 py-2 rounded-r hover:bg-green-600"
                disabled={!newLocation}
              >
                Add
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Excluded Categories</h2>
            <p className="text-gray-600 mb-4">
              Select categories you're not interested in. Exhibitions in these categories will not be shown in your recommendations.
            </p>
            
            <div className="flex flex-wrap gap-2 mb-4">
              {preferences.excludedCategories.map((category, index) => (
                <div 
                  key={index} 
                  className="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center"
                >
                  <span>{category}</span>
                  <button
                    type="button"
                    onClick={() => handlePreferenceChange('excludedCategories', 'remove', category)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              
              {preferences.excludedCategories.length === 0 && (
                <div className="text-gray-500 italic">No categories excluded</div>
              )}
            </div>
            
            <div className="flex">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Select a category to exclude...</option>
                {availableCategories.map((category, index) => (
                  <option key={index} value={category}>{category}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (newCategory) {
                    handlePreferenceChange('excludedCategories', 'add', newCategory);
                    setNewCategory('');
                  }
                }}
                className="bg-red-500 text-white px-4 py-2 rounded-r hover:bg-red-600"
                disabled={!newCategory}
              >
                Exclude
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Notification Settings</h2>
            <p className="text-gray-600 mb-4">
              How often would you like to receive email notifications about new exhibitions matching your preferences?
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['daily', 'weekly', 'monthly', 'never'].map((frequency) => (
                <div key={frequency} className="flex items-center">
                  <input
                    type="radio"
                    id={`frequency-${frequency}`}
                    name="notificationFrequency"
                    value={frequency}
                    checked={preferences.notificationFrequency === frequency}
                    onChange={() => handlePreferenceChange('notificationFrequency', 'add', frequency)}
                    className="h-4 w-4 text-rose-500 focus:ring-rose-500"
                  />
                  <label htmlFor={`frequency-${frequency}`} className="ml-2 text-gray-700 capitalize">
                    {frequency}
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={savePreferences}
              className="bg-rose-500 text-white px-6 py-2 rounded hover:bg-rose-600 disabled:bg-rose-300"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">How recommendations work</h3>
              <p className="mt-1 text-gray-600">
                Based on your preferences, we'll personalize your exhibition recommendations. 
                The more preferences you set, the better we can tailor our suggestions to your interests.
                Your preferences are used to highlight exhibitions that match your interests and filter out 
                those that don't.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">Loading...</div>}>
      <PreferencesContent />
    </Suspense>
  );
}