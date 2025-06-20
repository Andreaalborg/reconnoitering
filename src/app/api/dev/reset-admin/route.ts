import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
  try {
    await dbConnect();
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Update the admin user
    const user = await User.findOneAndUpdate(
      { email: 'admin@reconnoitering.com' },
      { 
        password: hashedPassword,
        emailVerified: true,
        role: 'admin'
      },
      { new: true, upsert: true }
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Admin user reset successfully!',
      credentials: {
        email: 'admin@reconnoitering.com',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Error resetting admin:', error);
    return NextResponse.json({ error: 'Failed to reset admin' }, { status: 500 });
  }
}