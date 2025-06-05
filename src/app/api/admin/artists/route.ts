import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Artist from '@/models/Artist';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    const artists = await Artist.find().sort({ name: 1 });
    
    return NextResponse.json({ 
      success: true, 
      data: artists 
    });
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch artists' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const artist = await Artist.create(body);
    
    return NextResponse.json({ 
      success: true, 
      data: artist 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating artist:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'En kunstner med dette navnet eksisterer allerede' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create artist' },
      { status: 500 }
    );
  }
} 