export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 shadow-md rounded-lg max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-rose-500 mb-4">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you are looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-3 rounded-md inline-block"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
}
