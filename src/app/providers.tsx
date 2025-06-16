'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  // På Vercel, bruk en enklere tilnærming uten mounted state
  if (typeof window === 'undefined') {
    // Server-side rendering
    return <>{children}</>;
  }

  // Client-side
  return (
    <SessionProvider 
      refetchInterval={0} 
      refetchOnWindowFocus={false}
    >
      {children}
    </SessionProvider>
  );
}