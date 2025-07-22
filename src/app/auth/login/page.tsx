'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

// Create a client component for the parts that use useSearchParams
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if the user just registered
    const registered = searchParams.get('registered');
    if (registered === 'true') {
      setSuccessMessage('Account created successfully! Please check your email to verify your account before signing in.');
    }
    
    // Check if the user just verified their email
    const verified = searchParams.get('verified');
    if (verified === 'true') {
      setSuccessMessage('Email verified successfully! You can now sign in.');
    }
    
    // Check if user was redirected from a protected page
    const callbackUrl = searchParams.get('callbackUrl');
    if (callbackUrl && !registered && !verified) {
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
        // Redirect to home page or callback URL
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
    <div className="card-minimal p-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-serif text-[var(--primary)] mb-6 text-center">Sign In</h1>
      
      {error && (
        <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      {successMessage && (
        <div className="mb-6 p-3 sm:p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 sm:p-3.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:border-transparent text-base"
            placeholder="your@email.com"
            required
            autoComplete="email"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 sm:p-3.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:border-transparent text-base"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full btn-primary py-3 sm:py-3.5 text-base"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <SocialLoginButtons />
      </div>
      
      <div className="mt-6 text-center space-y-3">
        <p className="text-[var(--text-muted)]">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-[var(--secondary)] hover:text-[var(--secondary-hover)] font-medium">
            Create Account
          </Link>
        </p>
        <Link href="/auth/forgot-password" className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)]">
          Forgot your password?
        </Link>
      </div>
    </div>
  );
}

// Main page component with Suspense
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="container-narrow py-12 sm:py-16">
        <div className="max-w-md mx-auto">
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}