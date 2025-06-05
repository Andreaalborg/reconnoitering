// src/app/api/recommendations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
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
    
    // Preferred tags (boost score for matches)
    if (preferences.preferredTags && preferences.preferredTags.length > 0) {
      matchScoreFields.preferredTagMatch = {
        $size: {
          $setIntersection: ['$tags', preferences.preferredTags]
        }
      };
    }
    
    // Preferred artists (boost score for matches)
    if (preferences.preferredArtists && preferences.preferredArtists.length > 0) {
      matchScoreFields.preferredArtistMatch = {
        $size: {
          $setIntersection: ['$artists', preferences.preferredArtists]
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
    
    // Excluded tags (filter out unwanted tags)
    if (preferences.excludedTags && preferences.excludedTags.length > 0) {
      query.tags = { $nin: preferences.excludedTags };
    }
    
    // City filter (if provided)
    const city = searchParams.get('city');
    if (city) {
      query['location.city'] = city;
    }
    
    // Tag filter (if provided)
    const tag = searchParams.get('tag');
    if (tag) {
      query.tags = tag;
    }
    
    // Artist filter (if provided)
    const artist = searchParams.get('artist');
    if (artist) {
      query.artists = artist;
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
                { $multiply: [{ $ifNull: ['$preferredTagMatch', 0] }, 2] }, // Tags vektes høyere
                { $ifNull: ['$preferredArtistMatch', 0] },
                { $cond: [{ $in: ['$location.city', preferences.preferredLocations || []] }, 1, 0] }
              ]
            }
          }
        },
        { $sort: { recommendationScore: -1, startDate: 1 } },
        { $skip: skip },
        { $limit: limit },
        // Populate venue, tags og artists
        {
          $lookup: {
            from: 'venues',
            localField: 'venue',
            foreignField: '_id',
            as: 'venue'
          }
        },
        { $unwind: '$venue' },
        {
          $lookup: {
            from: 'tags',
            localField: 'tags',
            foreignField: '_id',
            as: 'tags'
          }
        },
        {
          $lookup: {
            from: 'artists',
            localField: 'artists',
            foreignField: '_id',
            as: 'artists'
          }
        }
      ]);
    } else {
      // If no preferences are set, just sort by date
      exhibitions = await Exhibition.find(query)
        .populate('venue')
        .populate('tags')
        .populate('artists')
        .sort({ startDate: 1 })
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