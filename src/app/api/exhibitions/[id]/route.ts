import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const id = context.params.id;
    
    console.log(`Fetching exhibition with ID: ${id}`);

    if (!id) {
      return NextResponse.json({ success: false, error: 'Exhibition ID missing' }, { status: 400 });
    }

    const exhibition = await Exhibition.findById(id);
    
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    const body = await request.json();
    
    const exhibition = await Exhibition.findByIdAndUpdate(
      id,
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
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const { id } = params;
    
    const exhibition = await Exhibition.findByIdAndDelete(id);
    
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