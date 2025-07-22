// src/app/newsletter/unsubscribed/page.tsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Heart, ArrowRight } from 'lucide-react';

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-6">
            <CheckCircle2 className="h-8 w-8 text-gray-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            You&apos;ve been unsubscribed
          </h1>
          
          <p className="text-gray-600 mb-6">
            We&apos;re sorry to see you go! You&apos;ve been successfully removed from our newsletter list and won&apos;t receive any more emails from us.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
              <Heart className="w-4 h-4 mr-2" />
              We&apos;d love your feedback
            </div>
            <p className="text-xs text-gray-500">
              If you have a moment, let us know why you unsubscribed so we can improve our newsletter.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Continue Exploring
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            
            <Link
              href="/contact?subject=newsletter-feedback"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Share Feedback
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Changed your mind? You can always{' '}
              <Link href="/" className="text-rose-600 hover:text-rose-700">
                subscribe again
              </Link>{' '}
              from our homepage.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}