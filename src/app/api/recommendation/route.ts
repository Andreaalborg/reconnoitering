// src/app/api/recommendations/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Exhibition from '@/models/Exhibition';
import mongoose from 'mongoose';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();
    
    // Ensure models are registered to avoid issues in serverless environments
    const UserModel = mongoose.models.User || mongoose.model('User', User.schema);
    const ExhibitionModel = mongoose.models.Exhibition || mongoose.model('Exhibition', Exhibition.schema);

    const user = await UserModel.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '6');
    const preferences = user.preferences || {};

    const query: any = {
      // Ensure we only recommend exhibitions that are currently running or upcoming
      endDate: { $gte: new Date() } 
    };
    
    // Build the aggregation pipeline
    const pipeline: any[] = [{ $match: query }];

    // If user has preferences, calculate a recommendation score
    if (Object.keys(preferences).length > 0 && (preferences.preferredTags?.length || preferences.preferredArtists?.length || preferences.preferredLocations?.length)) {
      
      const addFieldsStage: any = {
        recommendationScore: { $add: [] }
      };

      // Score based on tags
      if (preferences.preferredTags?.length) {
        addFieldsStage.recommendationScore.$add.push(
          { $multiply: [{ $size: { $ifNull: [{ $setIntersection: ['$tags', preferences.preferredTags] }, []] } }, 2] }
        );
      }
      
      // Score based on artists
      if (preferences.preferredArtists?.length) {
        addFieldsStage.recommendationScore.$add.push(
          { $size: { $ifNull: [{ $setIntersection: ['$artists', preferences.preferredArtists] }, []] } }
        );
      }
      
      // Score based on location
      if (preferences.preferredLocations?.length) {
        addFieldsStage.recommendationScore.$add.push(
          { $cond: [{ $in: ['$location.city', preferences.preferredLocations] }, 1, 0] }
        );
      }
      
      pipeline.push({ $addFields: addFieldsStage });
      pipeline.push({ $sort: { recommendationScore: -1, startDate: 1 } });
    
    } else {
      // Default sort for users without preferences
      pipeline.push({ $sort: { popularity: -1, startDate: 1 } });
    }

    // Add pagination and projection
    pipeline.push({ $limit: limit });
    
    // Lookup venue information
    pipeline.push({
      $lookup: {
        from: 'venues',
        localField: 'venue',
        foreignField: '_id',
        as: 'venueInfo'
      }
    });
    
    // Use $unwind in a safer way, with an option to preserve documents that don't have a venue
    pipeline.push({
      $unwind: {
        path: '$venueInfo',
        preserveNullAndEmptyArrays: true
      }
    });
    
    // Replace the original venue ID with the populated venue document
    pipeline.push({
      $addFields: {
        venue: '$venueInfo'
      }
    });
    
    // Remove the temporary venueInfo field
    pipeline.push({
      $project: {
        venueInfo: 0
      }
    });

    const exhibitions = await ExhibitionModel.aggregate(pipeline);

    return NextResponse.json({
      success: true,
      data: exhibitions,
      meta: {
        total: exhibitions.length,
        hasPreferences: Object.keys(preferences).length > 0
      }
    });

  } catch (error: any) {
    console.error('Error in /api/recommendation:', error);
    Sentry.captureException(error, {
      tags: { api: 'recommendation' },
      extra: { errorMessage: error.message }
    });
    return NextResponse.json(
      { success: false, error: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}