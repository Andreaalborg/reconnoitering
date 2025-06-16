import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Sjekk kritiske miljøvariabler
    const checks = {
      mongoUri: !!process.env.MONGODB_URI,
      mongoDb: !!process.env.MONGODB_DB,
      nextAuthSecret: !!process.env.NEXTAUTH_SECRET,
      googleMapsKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      vercel: process.env.VERCEL,
      timestamp: new Date().toISOString()
    };

    return NextResponse.json({
      status: 'ok',
      checks
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 });
  }
} 