import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Artist from '@/models/Artist';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const artist = await Artist.findByIdAndDelete(params.id);
    
    if (!artist) {
      return NextResponse.json(
        { success: false, error: 'Artist not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Artist deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting artist:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete artist' },
      { status: 500 }
    );
  }
} 