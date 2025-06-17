import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API fungerer!',
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      hasDatabase: !!process.env.DATABASE_URL,
      hasNextAuth: !!process.env.NEXTAUTH_SECRET,
    }
  });
} 