export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Exhibition from '@/models/Exhibition';
import * as Sentry from '@sentry/nextjs';
import { validateInput, logValidationError } from '@/utils/validation';

// GET user's favorites
export async function GET() {
  console.log("Starting fetch favorites process");
  
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      console.log("No authenticated session found");
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    const email = session.user.email;
    console.log("Authenticated user email:", email);
    
    // Find user and populate favorite exhibitions
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("User not found with email:", email);
      Sentry.captureMessage(`User not found in favorites: ${email}`, 'warning');
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
    Sentry.captureException(error, {
      tags: { api: 'favorites', action: 'get' },
      extra: { errorMessage: error.message }
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST add to favorites
export async function POST(request: NextRequest) {
  console.log("Starting add to favorites process");
  
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      console.log("No authenticated session found");
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validation = validateInput<{ exhibitionId: string }>(body, {
      exhibitionId: {
        required: true,
        type: 'objectId'
      }
    });

    if (!validation.isValid) {
      logValidationError('/api/user/favorites POST', validation.errors, body);
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: validation.errors },
        { status: 400 }
      );
    }

    const { exhibitionId } = validation.sanitized as { exhibitionId: string };
    
    await dbConnect();
    
    const email = session.user.email;
    console.log("Authenticated user email:", email);
    console.log("Exhibition ID to add:", exhibitionId);
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("User not found with email:", email);
      Sentry.captureMessage(`User not found in favorites POST: ${email}`, 'warning');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Initialize favorites array if it doesn't exist
    if (!user.favoriteExhibitions) {
      user.favoriteExhibitions = [];
    }
    
    // Check if already in favorites
    const isAlreadyFavorite = user.favoriteExhibitions.some(
      (id: any) => id.toString() === exhibitionId
    );
    
    if (isAlreadyFavorite) {
      return NextResponse.json({ 
        success: true, 
        message: 'Exhibition already in favorites',
        data: user.favoriteExhibitions 
      });
    }
    
    // Add to favorites
    user.favoriteExhibitions.push(exhibitionId);
    await user.save();
    
    console.log("Exhibition added to favorites successfully");
    
    // Fetch updated exhibition details
    const favoriteExhibitions = await Exhibition.find({
      _id: { $in: user.favoriteExhibitions }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Exhibition added to favorites',
      data: favoriteExhibitions 
    });
  } catch (error: any) {
    console.error('Error adding to favorites:', error);
    Sentry.captureException(error, {
      tags: { api: 'favorites', action: 'post' },
      extra: { errorMessage: error.message }
    });
    return NextResponse.json(
      { success: false, error: 'Failed to add to favorites' },
      { status: 500 }
    );
  }
}

// DELETE remove from favorites
export async function DELETE(request: NextRequest) {
  console.log("Starting remove from favorites process");
  
  try {
    // Get session using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      console.log("No authenticated session found");
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const validation = validateInput<{ exhibitionId: string }>(body, {
      exhibitionId: {
        required: true,
        type: 'objectId'
      }
    });

    if (!validation.isValid) {
      logValidationError('/api/user/favorites POST', validation.errors, body);
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: validation.errors },
        { status: 400 }
      );
    }

    const { exhibitionId } = validation.sanitized as { exhibitionId: string };
    
    await dbConnect();
    
    const email = session.user.email;
    console.log("Authenticated user email:", email);
    console.log("Exhibition ID to remove:", exhibitionId);
    
    // Find user
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log("User not found with email:", email);
      Sentry.captureMessage(`User not found in favorites DELETE: ${email}`, 'warning');
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Remove from favorites
    user.favoriteExhibitions = user.favoriteExhibitions.filter(
      (id: any) => id.toString() !== exhibitionId
    );
    await user.save();
    
    console.log("Exhibition removed from favorites successfully");
    
    // Fetch updated exhibition details
    const favoriteExhibitions = await Exhibition.find({
      _id: { $in: user.favoriteExhibitions }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Exhibition removed from favorites',
      data: favoriteExhibitions 
    });
  } catch (error: any) {
    console.error('Error removing from favorites:', error);
    Sentry.captureException(error, {
      tags: { api: 'favorites', action: 'delete' },
      extra: { errorMessage: error.message }
    });
    return NextResponse.json(
      { success: false, error: 'Failed to remove from favorites' },
      { status: 500 }
    );
  }
}