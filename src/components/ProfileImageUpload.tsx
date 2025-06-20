'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
}

const ProfileImageUpload = ({ currentImage, onImageChange }: ProfileImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Update preview when currentImage changes
  useEffect(() => {
    setPreviewUrl(currentImage || '');
  }, [currentImage]);
  
  const uploadImage = async (file: File) => {
    setUploading(true);
    setError(null);
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit');
      setUploading(false);
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only JPEG, PNG, GIF and WebP images are allowed');
      setUploading(false);
      return;
    }
    
    try {
      // Create a preview URL for the selected file
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Upload the file to the server
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/user/upload-avatar', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }
      
      // Set the uploaded image URL
      setPreviewUrl(data.url);
      onImageChange(data.url);
      
      // Clean up the object URL
      URL.revokeObjectURL(objectUrl);
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.');
      // Reset preview on error
      setPreviewUrl(currentImage || '');
    } finally {
      setUploading(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 mb-4">
        {previewUrl ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image 
              src={previewUrl}
              alt="Profile preview"
              fill
              className="object-cover"
              sizes="128px"
              unoptimized={previewUrl.startsWith('/uploads/')}
            />
            <button
              type="button"
              onClick={() => {
                setPreviewUrl('');
                onImageChange('');
              }}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full w-6 h-6 flex items-center justify-center"
              title="Remove image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="w-full h-full rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        )}
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-2 w-full max-w-xs">
        <label className="block text-center w-full cursor-pointer bg-rose-500 hover:bg-rose-600 text-white rounded-md shadow-sm py-2 px-3 text-sm font-medium">
          <span>Upload Photo</span>
          <input 
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            className="sr-only"
            disabled={uploading}
          />
        </label>
        
        <p className="text-xs text-gray-500 text-center">
          Max 2MB - JPEG, PNG, GIF or WebP
        </p>
        
        {error && (
          <div className="text-red-500 text-sm mt-2 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUpload;