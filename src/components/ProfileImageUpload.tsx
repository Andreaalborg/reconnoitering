'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
}

const ProfileImageUpload = ({ currentImage, onImageChange }: ProfileImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>(currentImage || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For demonstration purposes, we'll use a placeholder image service
  // In a real application, you would use a file upload API with proper storage
  const getRandomPlaceholderImage = () => {
    // Generate a random ID for the placeholder image (1-1000)
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/id/${randomId}/200/200`;
  };
  
  const simulateUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size exceeds 2MB limit');
      setUploading(false);
      return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      setUploading(false);
      return;
    }
    
    try {
      // Create a preview URL for the selected file
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      
      // Simulate an upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real application, you would upload the file to a server here
      // and get back a permanent URL
      const uploadedImageUrl = getRandomPlaceholderImage();
      
      // Set the uploaded image URL
      setPreviewUrl(uploadedImageUrl);
      onImageChange(uploadedImageUrl);
      
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateUpload(file);
    }
  };
  
  const handlePlaceholderClick = () => {
    // For demonstration: set a random placeholder image
    const placeholderUrl = getRandomPlaceholderImage();
    setPreviewUrl(placeholderUrl);
    onImageChange(placeholderUrl);
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
            accept="image/*"
            onChange={handleImageChange}
            className="sr-only"
          />
        </label>
        
        <button
          type="button"
          onClick={handlePlaceholderClick}
          className="bg-gray-200 border border-gray-300 rounded-md py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Use Random Avatar
        </button>
        
        {error && (
          <div className="text-red-500 text-sm mt-1 text-center">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUpload;