// src/app/newsletter/confirmed/page.tsx
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, ArrowRight } from 'lucide-react';

export default function NewsletterConfirmedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Welcome to Reconnoitering!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Your subscription has been confirmed. You&apos;ll start receiving our weekly newsletter with the latest art exhibitions and exclusive content.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-center text-sm text-gray-600 mb-2">
              <Mail className="w-4 h-4 mr-2" />
              What to expect:
            </div>
            <ul className="text-xs text-gray-500 text-left space-y-1">
              <li>• Weekly exhibition highlights and recommendations</li>
              <li>• Early access to exclusive events and previews</li>
              <li>• Artist spotlights and behind-the-scenes content</li>
              <li>• No spam, ever. Unsubscribe anytime.</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Explore Exhibitions
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
            
            <Link
              href="/account/preferences"
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500"
            >
              Update Preferences
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}