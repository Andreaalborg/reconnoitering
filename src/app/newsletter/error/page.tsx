// src/app/newsletter/error/page.tsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertCircle, Mail, ArrowRight } from 'lucide-react';

export default function NewsletterErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Something went wrong
          </h1>
          
          <p className="text-gray-600 mb-6">
            We encountered an error processing your newsletter request. This could be due to an expired link or a technical issue.
          </p>
          
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center text-sm text-red-600 mb-2">
              <Mail className="w-4 h-4 mr-2" />
              Need help?
            </div>
            <p className="text-xs text-red-500">
              Try subscribing again from our homepage, or contact us if the problem persists.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Go to Homepage
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            
            <Link
              href="/contact"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}