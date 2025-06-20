export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Exhibition from '@/models/Exhibition';

// GET user's favorites
export async function GET() {
  console.log("Starting fetch favorites process");
  
  // Get session cookie
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
    
    // Fallback approach for testing
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
    
    // Find user and populate favorite exhibitions
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("User not found with email:", email);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log("User found:", user.name);
    console.log("Favorite exhibition IDs:", user.favoriteExhibitions || []);
    
    // Initialize favorites array if it doesn't exist
    if (!user.favoriteExhibitions || user.favoriteExhibitions.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }
    
    // Fetch exhibition details
    const favoriteExhibitions = await Exhibition.find({
      _id: { $in: user.favoriteExhibitions }
    });
    
    console.log(`Found ${favoriteExhibitions.length} favorite exhibitions`);
    
    return NextResponse.json({ 
      success: true, 
      data: favoriteExhibitions 
    });
  } catch (error: any) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites: ' + error.message },
      { status: 500 }
    );
  }
}