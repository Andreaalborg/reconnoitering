'use client';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function PreferencesPage() {
  if (typeof window !== 'undefined') {
    // Only redirect in the browser, not during build
    redirect('/');
  }
  
  // This page will just return an empty div during build
  return <div />;
}