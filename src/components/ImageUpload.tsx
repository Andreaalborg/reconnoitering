'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageUploadProps {
  initialImage?: string;
  onImageChange: (imageUrl: string) => void;
  label: string;
  required?: boolean;
}

const ImageUpload = ({ initialImage, onImageChange, label, required = false }: ImageUploadProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>(initialImage || '');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // For demonstration purposes, we'll use a placeholder image service
  // In a real application, you would use a file upload API with proper storage
  const getRandomPlaceholderImage = () => {
    // Generate a random ID for the placeholder image
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/id/${randomId}/800/600`;
  };
  
  const simulateUpload = async (file: File) => {
    setUploading(true);
    setError(null);
    
    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit');
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
      await new Promise(resolve => setTimeout(resolve, 1500));
      
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
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center h-48 relative">
          {previewUrl ? (
            <div className="relative w-full h-full">
              <Image 
                src={previewUrl}
                alt="Image preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <button
                type="button"
                onClick={() => {
                  setPreviewUrl('');
                  onImageChange('');
                }}
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full w-8 h-8 flex items-center justify-center"
                title="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-center p-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mx-auto w-12 h-12 text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="mt-2 text-sm text-gray-500">No image selected</p>
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        
        <div className="flex flex-col space-y-3">
          <div>
            <label className="block w-full cursor-pointer bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm font-medium text-gray-700 text-center hover:bg-gray-50">
              <span>Upload an image</span>
              <input 
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>
            <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
          </div>
          
          <button
            type="button"
            onClick={handlePlaceholderClick}
            className="bg-gray-200 border border-gray-300 rounded-md py-2 px-3 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Use placeholder image
          </button>
          
          {error && (
            <div className="text-red-500 text-sm mt-1">
              {error}
            </div>
          )}
          
          {previewUrl && (
            <input
              type="text"
              value={previewUrl}
              onChange={(e) => {
                setPreviewUrl(e.target.value);
                onImageChange(e.target.value);
              }}
              placeholder="Image URL"
              className="border border-gray-300 rounded-md py-2 px-3 text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpload;