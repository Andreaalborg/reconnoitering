'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validatePassword, getPasswordStrength } from '@/utils/passwordValidation';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    if (password) {
      const validation = validatePassword(password);
      setPasswordErrors(validation.errors);
      if (validation.isValid) {
        setPasswordStrength(getPasswordStrength(password));
      } else {
        setPasswordStrength(null);
      }
    } else {
      setPasswordErrors([]);
      setPasswordStrength(null);
    }
  }, [password]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!name || !email || !password) {
      setError('All fields are required');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Validate password
    if (passwordErrors.length > 0) {
      setError('Please fix password errors before submitting');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      
      // Show success message about email verification
      setError('');
      alert('Registration successful! Please check your email to verify your account before logging in.');
      router.push('/auth/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="card-minimal p-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-serif text-[var(--primary)] mb-6 text-center">Create an Account</h1>
      
      {error && (
        <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 sm:p-3.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:border-transparent text-base"
            placeholder="John Doe"
            required
            autoComplete="name"
          />
        </div>
        
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
            autoComplete="new-password"
          />
          {password && (
            <div className="mt-2">
              {passwordErrors.length > 0 ? (
                <ul className="text-xs text-red-600 space-y-1">
                  {passwordErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              ) : passwordStrength && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-[var(--text-muted)]">Password strength:</span>
                    <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                      {passwordStrength}
                    </span>
                  </div>
                  <div className="flex space-x-1">
                    <div className={`h-1.5 flex-1 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                    <div className={`h-1.5 flex-1 rounded ${passwordStrength === 'medium' ? 'bg-yellow-500' : passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <div className={`h-1.5 flex-1 rounded ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full p-3 sm:p-3.5 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--secondary)] focus:border-transparent text-base"
            placeholder="••••••••"
            required
            autoComplete="new-password"
          />
        </div>
        
        <div className="pt-2">
          <button
            type="submit"
            className="w-full btn-primary py-3 sm:py-3.5 text-base"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
      
      <div className="mt-6">
        <SocialLoginButtons />
      </div>
      
      <div className="mt-6 text-center">
        <p className="text-[var(--text-muted)]">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-[var(--secondary)] hover:text-[var(--secondary-hover)] font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="container-narrow py-12 sm:py-16">
        <div className="max-w-md mx-auto">
          <Suspense fallback={<div className="text-center">Loading...</div>}>
            <RegisterForm />
          </Suspense>
        </div>
      </main>
    </div>
  );
}