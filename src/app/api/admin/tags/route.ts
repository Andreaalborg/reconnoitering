import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Tag from '@/models/Tag';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    
    const tags = await Tag.find().sort({ name: 1 });
    
    return NextResponse.json({ 
      success: true, 
      data: tags 
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    const tag = await Tag.create(body);
    
    return NextResponse.json({ 
      success: true, 
      data: tag 
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating tag:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'En tag med dette navnet eksisterer allerede' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to create tag' },
      { status: 500 }
    );
  }
} 