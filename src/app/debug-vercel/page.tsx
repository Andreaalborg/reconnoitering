'use client';

import { useEffect, useState } from 'react';

export default function DebugVercel() {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkEnvironment() {
      try {
        // Sjekk om vi er på Vercel
        const isVercel = process.env.VERCEL === '1';
        
        // Test API-tilkobling
        const apiTest = await fetch('/api/health').then(r => r.json()).catch(e => ({ error: e.message }));
        
        setDebugInfo({
          environment: process.env.NODE_ENV,
          isVercel,
          hasMongoUri: !!process.env.MONGODB_URI,
          hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
          hasGoogleMapsKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
          apiTest,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    }
    
    checkEnvironment();
  }, []);

  if (loading) return <div>Laster debug-info...</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Vercel Debug Info</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(debugInfo, null, 2)}
      </pre>
    </div>
  );
} 