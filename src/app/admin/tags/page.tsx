'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { toast } from 'react-hot-toast';

interface Tag {
  _id: string;
  name: string;
  slug: string;
  description?: string;
}

export default function TagsPage() {
  const router = useRouter();
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newTag, setNewTag] = useState({ name: '', description: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/admin/tags');
      if (!response.ok) throw new Error('Failed to fetch tags');
      const data = await response.json();
      setTags(data.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Kunne ikke hente tags');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/admin/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTag)
      });

      if (!response.ok) throw new Error('Failed to create tag');
      
      await fetchTags();
      setNewTag({ name: '', description: '' });
      toast.success('Tag opprettet');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error('Kunne ikke opprette tag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne taggen?')) return;

    try {
      const response = await fetch(`/api/admin/tags/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete tag');
      
      await fetchTags();
      toast.success('Tag slettet');
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Kunne ikke slette tag');
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Administrer Tags</h1>

        {/* Ny tag form */}
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Legg til ny tag</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Navn *
              </label>
              <input
                type="text"
                id="name"
                value={newTag.name}
                onChange={(e) => setNewTag(prev => ({ ...prev, name: e.target.value }))}
                required
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivelse
              </label>
              <textarea
                id="description"
                value={newTag.description}
                onChange={(e) => setNewTag(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                rows={3}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-500 text-white rounded hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Legger til...' : 'Legg til tag'}
            </button>
          </div>
        </form>

        {/* Tags liste */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <h2 className="text-lg font-semibold p-4 border-b">Eksisterende tags</h2>
          {isLoading ? (
            <div className="p-4 text-center">Laster tags...</div>
          ) : tags.length === 0 ? (
            <div className="p-4 text-center text-gray-500">Ingen tags funnet</div>
          ) : (
            <ul className="divide-y">
              {tags.map((tag) => (
                <li key={tag._id} className="p-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{tag.name}</h3>
                    {tag.description && (
                      <p className="text-sm text-gray-500 mt-1">{tag.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(tag._id)}
                    className="text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    Slett
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </AdminLayout>
  );
} 