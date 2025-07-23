'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { Suspense } from 'react';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: 'Account Not Found',
          message: 'This Google/Facebook account is not linked to any existing account. Please register first, then you can link your social accounts.',
          showRegister: true
        };
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Already Exists',
          message: 'An account with this email already exists. Please sign in with your email and password first.',
          showRegister: false
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An error occurred during authentication. Please try again.',
          showRegister: false
        };
    }
  };

  const { title, message, showRegister } = getErrorMessage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-4">
            {title}
          </h2>
          
          <p className="text-center text-gray-600 mb-8">
            {message}
          </p>
          
          <div className="space-y-4">
            {showRegister ? (
              <>
                <Link
                  href="/auth/register"
                  className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Create Account
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Back to Login
                </Link>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Back to Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}