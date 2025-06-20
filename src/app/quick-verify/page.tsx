'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickVerifyPage() {
  const [email, setEmail] = useState('intsenai@gmail.com');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  
  const verifyUser = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/temp-disable-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ ' + data.message);
        setTimeout(() => {
          router.push('/auth/login');
        }, 2000);
      } else {
        setMessage('❌ ' + (data.error || 'Something went wrong'));
      }
    } catch (error) {
      setMessage('❌ Failed to verify user');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Quick Email Verification (Dev Only)</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email to verify:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
          
          <button
            onClick={verifyUser}
            disabled={loading || !email}
            className="w-full bg-rose-500 text-white py-2 rounded hover:bg-rose-600 disabled:bg-gray-300"
          >
            {loading ? 'Verifying...' : 'Mark Email as Verified'}
          </button>
          
          {message && (
            <div className={`p-3 rounded ${message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}
        </div>
        
        <div className="mt-6 text-sm text-gray-600">
          <p>This temporarily marks the email as verified so you can login.</p>
          <p className="mt-2 font-bold">⚠️ Remove this in production!</p>
        </div>
      </div>
    </div>
  );
}