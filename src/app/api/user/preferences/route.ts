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

// src/app/api/recommendations/route.ts - API for personalized exhibition recommendations

import Exhibition from '@/models/Exhibition';

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
    
    // Get user preferences
    const preferences = user.preferences || {};
    const { searchParams } = new URL(request.url);
    
    // Build query based on preferences and any additional filters
    const query: any = {};
    
    // Filter by date range (if provided)
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    if (startDate || endDate) {
      query.$and = [];
      
      if (startDate) {
        query.$and.push({ endDate: { $gte: new Date(startDate) } });
      }
      
      if (endDate) {
        query.$and.push({ startDate: { $lte: new Date(endDate) } });
      }
    }
    
    // Apply preferences
    const matchScoreFields: any = {};
    
    // Preferred categories (boost score for matches)
    if (preferences.preferredCategories && preferences.preferredCategories.length > 0) {
      matchScoreFields.preferredCategoryMatch = {
        $size: {
          $filter: {
            input: '$category',
            as: 'cat',
            cond: { $in: ['$$cat', preferences.preferredCategories] }
          }
        }
      };
    }
    
    // Preferred artists (boost score for matches)
    if (preferences.preferredArtists && preferences.preferredArtists.length > 0) {
      matchScoreFields.preferredArtistMatch = {
        $size: {
          $filter: {
            input: '$artists',
            as: 'artist',
            cond: { $in: ['$$artist', preferences.preferredArtists] }
          }
        }
      };
    }
    
    // Preferred locations (boost score for matches)
    if (preferences.preferredLocations && preferences.preferredLocations.length > 0) {
      // Add a $or query for location matches
      query.$or = [
        { 'location.city': { $in: preferences.preferredLocations } },
        { 'location.country': { $in: preferences.preferredLocations } }
      ];
    }
    
    // Excluded categories (filter out unwanted categories)
    if (preferences.excludedCategories && preferences.excludedCategories.length > 0) {
      query.category = { $not: { $elemMatch: { $in: preferences.excludedCategories } } };
    }
    
    // City filter (if provided)
    const city = searchParams.get('city');
    if (city) {
      query['location.city'] = city;
    }
    
    // Category filter (if provided)
    const category = searchParams.get('category');
    if (category) {
      if (!query.category) {
        query.category = { $in: [category] };
      } else {
        // Handle case where excludedCategories is already set
        query.$and = query.$and || [];
        query.$and.push({ category: { $in: [category] } });
      }
    }
    
    // Limit and skip for pagination
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Fetch exhibitions and calculate recommendation score
    let exhibitions;
    
    if (Object.keys(matchScoreFields).length > 0) {
      // Calculate recommendation score based on preferences
      exhibitions = await Exhibition.aggregate([
        { $match: query },
        {
          $addFields: matchScoreFields
        },
        {
          $addFields: {
            // Calculate recommendation score (higher is better)
            recommendationScore: {
              $sum: [
                { $ifNull: ['$preferredCategoryMatch', 0] },
                { $ifNull: ['$preferredArtistMatch', 0] },
                { $ifNull: ['$popularity', 0] }
              ]
            }
          }
        },
        { $sort: { recommendationScore: -1, startDate: 1 } },
        { $skip: skip },
        { $limit: limit }
      ]);
    } else {
      // If no preferences are set, just sort by popularity
      exhibitions = await Exhibition.find(query)
        .sort({ popularity: -1, startDate: 1 })
        .skip(skip)
        .limit(limit);
    }
    
    // Get total count for pagination
    const total = await Exhibition.countDocuments(query);
    
    return NextResponse.json({
      success: true,
      data: exhibitions,
      meta: {
        total,
        hasPreferences: Object.keys(matchScoreFields).length > 0
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching recommendations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations: ' + error.message },
      { status: 500 }
    );
  }
}