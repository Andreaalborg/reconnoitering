'use client';

export default function HealthPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Health Check</h1>
      <div className="space-y-2">
        <p>Environment: {process.env.NODE_ENV}</p>
        <p>Has Google Maps Key: {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Yes' : 'No'}</p>
        <p>NextAuth URL: {process.env.NEXTAUTH_URL || 'Not set'}</p>
        <p>Page loaded successfully!</p>
      </div>
    </div>
  );
}