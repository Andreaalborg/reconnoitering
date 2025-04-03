'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import Header from '@/components/Header';

export default function AboutPage() {
  // Client-side only rendering
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // During server-side rendering or build, return minimal content
  if (!isMounted) {
    return <div className="min-h-screen bg-gray-50"></div>;
  }
  
  // Regular component for client rendering
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About Reconnoitering</h1>
        
        <div className="bg-white rounded-lg shadow-md p-8">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              Reconnoitering aims to help art enthusiasts discover exhibitions worldwide based on their travel plans. 
              We understand the frustration of missing great exhibitions because you didn't know they were happening 
              during your visit to a city.
            </p>
            <p className="text-gray-700">
              Our platform allows you to explore art exhibitions by location and date, ensuring you can make the most
              of your cultural experiences wherever and whenever you travel.
            </p>
          </section>
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="bg-rose-100 text-rose-500 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Select Your Destination</h3>
                <p className="text-gray-600">Choose a city or location you plan to visit.</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="bg-rose-100 text-rose-500 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Set Your Dates</h3>
                <p className="text-gray-600">Enter the dates of your planned visit.</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="bg-rose-100 text-rose-500 rounded-full w-10 h-10 flex items-center justify-center text-xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Discover Exhibitions</h3>
                <p className="text-gray-600">Browse exhibitions available during your stay and plan your visits.</p>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              Have questions, suggestions, or want to list your exhibition on our platform? We'd love to hear from you!
            </p>
            <a 
              href="mailto:contact@reconnoitering.com" 
              className="inline-block bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-6 rounded"
            >
              Get in Touch
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}