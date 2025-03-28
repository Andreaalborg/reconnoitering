// src/app/api/user/preferences/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

// GET user preferences
export async function GET(request: NextRequest) {
  try {
    // Get session data
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Connect to database
    await dbConnect();
    
    // Find user by email
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user preferences
    return NextResponse.json({
      success: true,
      data: user.preferences || {
        preferredCategories: [],
        preferredArtists: [],
        preferredLocations: [],
        excludedCategories: [],
        notificationFrequency: 'weekly'
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch preferences: ' + error.message },
      { status: 500 }
    );
  }
}

// Update user preferences
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
    
    // Connect to database
    await dbConnect();
    
    // Find user by email
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Initialize preferences if needed
    if (!user.preferences) {
      user.preferences = {};
    }
    
    // Update preferences
    if (body.preferredCategories !== undefined) {
      user.preferences.preferredCategories = body.preferredCategories;
    }
    
    if (body.preferredArtists !== undefined) {
      user.preferences.preferredArtists = body.preferredArtists;
    }
    
    if (body.preferredLocations !== undefined) {
      user.preferences.preferredLocations = body.preferredLocations;
    }
    
    if (body.excludedCategories !== undefined) {
      user.preferences.excludedCategories = body.excludedCategories;
    }
    
    if (body.notificationFrequency !== undefined) {
      user.preferences.notificationFrequency = body.notificationFrequency;
    }
    
    // Save changes
    await user.save();
    
    // Return updated preferences
    return NextResponse.json({
      success: true,
      data: user.preferences
    });
    
  } catch (error: any) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update preferences: ' + error.message },
      { status: 500 }
    );
  }
}