import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI: process.env.MONGODB_URI ? 'Set' : 'Missing',
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'Missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? 'Set' : 'Missing',
    timestamp: new Date().toISOString(),
    headers: {
      host: 'Will be set by request',
      userAgent: 'Will be set by request'
    }
  };

  return NextResponse.json(envCheck);
}