import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// TEMPORARY - FOR TESTING ONLY!
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }
    
    await dbConnect();
    
    // Temporarily mark user as verified
    const user = await User.findOneAndUpdate(
      { email },
      { emailVerified: true },
      { new: true }
    );
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'User temporarily marked as verified. You can now login!',
      email: user.email,
      emailVerified: user.emailVerified
    });
    
  } catch (error) {
    console.error('Error marking user as verified:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}