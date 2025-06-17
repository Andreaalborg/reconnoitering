import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Simple test API called');
  
  try {
    // Bare returner en enkel response uten database
    return NextResponse.json({
      success: true,
      message: 'API is working',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoUri: !!process.env.MONGODB_URI,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleMapsKey: !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      }
    });
  } catch (error) {
    console.error('Simple test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}