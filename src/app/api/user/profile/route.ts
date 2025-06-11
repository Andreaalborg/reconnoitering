import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
// Endre denne importlinjen:
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(request: NextRequest) {
  try {
    // Get session data
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await request.json();
    const { name, image } = body;
    
    // Validate data
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Find the user by email
    const userEmail = session.user.email;
    console.log('Looking for user with email:', userEmail);
    
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('User not found with email:', userEmail);
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    console.log('User found:', user.name);
    console.log('Updating with name:', name, 'and image:', image);
    
    // Update user data
    user.name = name;
    if (image !== undefined) {
      user.image = image;
    }
    
    // Save to database
    await user.save();
    
    console.log('User updated successfully');
    
    // Return updated user data (without password)
    return NextResponse.json({
      success: true,
      data: {
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile: ' + error.message },
      { status: 500 }
    );
  }
}