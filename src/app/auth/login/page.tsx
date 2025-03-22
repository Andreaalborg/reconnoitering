'use client';

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Sjekk om brukeren nettopp har registrert seg
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccessMessage('Account created successfully! Please sign in.');
    }
    
    // Sjekk om brukeren ble omdirigert fra en beskyttet side
    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl) {
      setSuccessMessage('Please sign in to continue.');
    }
  }, [searchParams]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setError(result.error);
      } else {
        // Omdiriger til hjemmesiden eller callback-URL
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        router.push(callbackUrl);
      }
    } catch (err: any) {
      setError(err.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Sign In</h1>
          
          {error && (
            <div className="mb-6 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="mb-6 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {successMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>
            
            <div>
              <button
                type="submit"
                className="w-full bg-rose-500 text-white py-2 px-4 rounded hover:bg-rose-600 transition-colors disabled:bg-rose-300"
                disabled={loading}
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="text-rose-500 hover:text-rose-700">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}