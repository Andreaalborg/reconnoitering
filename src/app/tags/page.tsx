'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag } from 'lucide-react';

interface TagData {
  _id: string;
  name: string;
  count: number;
}

export default function TagsPage() {
  const [tags, setTags] = useState<TagData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const response = await fetch('/api/tags');
      if (response.ok) {
        const data = await response.json();
        setTags(data);
      }
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Explore by Tags
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover exhibitions through our curated collection of tags
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {tags.map((tag) => (
            <Link
              key={tag._id}
              href={`/exhibitions?tag=${encodeURIComponent(tag.name)}`}
              className="group bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-rose-500 hover:shadow-lg transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-2">
                <Tag className="w-5 h-5 text-gray-400 group-hover:text-rose-500" />
                <span className="text-sm text-gray-500 font-medium">
                  {tag.count}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 group-hover:text-rose-600">
                {tag.name}
              </h3>
            </Link>
          ))}
        </div>

        {tags.length === 0 && (
          <div className="text-center py-16">
            <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No tags found</p>
          </div>
        )}
      </div>
    </div>
  );
}