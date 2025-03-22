import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const exhibition = await Exhibition.findById(params.id);
    
    if (!exhibition) {
      return NextResponse.json(
        { success: false, error: 'Exhibition not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: exhibition });
  } catch (error) {
    console.error('Error fetching exhibition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exhibition' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    const exhibition = await Exhibition.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    );
    
    if (!exhibition) {
      return NextResponse.json(
        { success: false, error: 'Exhibition not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: exhibition });
  } catch (error) {
    console.error('Error updating exhibition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update exhibition' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const exhibition = await Exhibition.findByIdAndDelete(params.id);
    
    if (!exhibition) {
      return NextResponse.json(
        { success: false, error: 'Exhibition not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: {} });
  } catch (error) {
    console.error('Error deleting exhibition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete exhibition' },
      { status: 500 }
    );
  }
}