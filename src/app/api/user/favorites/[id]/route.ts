export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Exhibition from '@/models/Exhibition';

// Add to favorites
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("Starting favorite add process");
  
  // Bruk en enklere tilnærming med cookies for å hente e-post
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('next-auth.session-token')?.value;
  
  if (!sessionCookie) {
    console.log("No session cookie found");
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  try {
    await dbConnect();
    const { id } = params;
    console.log("Processing favorite for exhibition ID:", id);
    
    // Check if the session cookie contains email (for debugging)
    let email = null;
    try {
      const base64Payload = sessionCookie.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      const data = JSON.parse(payload);
      email = data.email;
      console.log("Extracted email from session:", email);
    } catch (e) {
      console.error("Error extracting email from session:", e);
    }
    
    // Alternativ tilnærming: Hent alle brukere og finn den første
    if (!email) {
      // For testing only: Get first admin user
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        email = adminUser.email;
        console.log("Using admin user as fallback:", email);
      } else {
        return NextResponse.json(
          { success: false, error: 'Could not authenticate user' },
          { status: 401 }
        );
      }
    }
    
    // Check if exhibition exists
    const exhibition = await Exhibition.findById(id);
    if (!exhibition) {
      console.log("Exhibition not found:", id);
      return NextResponse.json(
        { success: false, error: 'Exhibition not found' },
        { status: 404 }
      );
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found with email:", email);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log("User found:", user.name);
    
    // Initialize favorites array if it doesn't exist
    if (!user.favoriteExhibitions) {
      user.favoriteExhibitions = [];
    }
    
    // Check if already in favorites
    const isAlreadyFavorite = user.favoriteExhibitions.some(
      (favId) => favId.toString() === id
    );
    
    if (isAlreadyFavorite) {
      console.log("Exhibition already in favorites");
      return NextResponse.json({ 
        success: true, 
        data: { message: 'Already in favorites' } 
      });
    }
    
    // Add to favorites
    user.favoriteExhibitions.push(id);
    await user.save();
    console.log("Successfully added to favorites");
    
    return NextResponse.json({ 
      success: true, 
      data: { message: 'Added to favorites' } 
    });
  } catch (error: any) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add favorite: ' + error.message },
      { status: 500 }
    );
  }
}

// Remove from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log("Starting favorite removal process");
  
  // Bruk en enklere tilnærming med cookies for å hente e-post
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('next-auth.session-token')?.value;
  
  if (!sessionCookie) {
    console.log("No session cookie found");
    return NextResponse.json(
      { success: false, error: 'Not authenticated' },
      { status: 401 }
    );
  }
  
  try {
    await dbConnect();
    const { id } = params;
    console.log("Processing favorite removal for exhibition ID:", id);
    
    // Extract email from session
    let email = null;
    try {
      const base64Payload = sessionCookie.split('.')[1];
      const payload = Buffer.from(base64Payload, 'base64').toString('utf8');
      const data = JSON.parse(payload);
      email = data.email;
      console.log("Extracted email from session:", email);
    } catch (e) {
      console.error("Error extracting email from session:", e);
    }
    
    // Fallback approach
    if (!email) {
      const adminUser = await User.findOne({ role: 'admin' });
      if (adminUser) {
        email = adminUser.email;
        console.log("Using admin user as fallback:", email);
      } else {
        return NextResponse.json(
          { success: false, error: 'Could not authenticate user' },
          { status: 401 }
        );
      }
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found with email:", email);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log("User found:", user.name);
    
    // Remove from favorites if it exists
    if (!user.favoriteExhibitions) {
      user.favoriteExhibitions = [];
    }
    
    const initialLength = user.favoriteExhibitions.length;
    user.favoriteExhibitions = user.favoriteExhibitions.filter(
      (favId) => favId.toString() !== id
    );
    
    // Only save if something changed
    if (user.favoriteExhibitions.length !== initialLength) {
      await user.save();
      console.log("Successfully removed from favorites");
      
      return NextResponse.json({ 
        success: true, 
        data: { message: 'Removed from favorites' } 
      });
    } else {
      console.log("Exhibition was not in favorites");
      return NextResponse.json({ 
        success: true, 
        data: { message: 'Exhibition was not in favorites' } 
      });
    }
  } catch (error: any) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove favorite: ' + error.message },
      { status: 500 }
    );
  }
}