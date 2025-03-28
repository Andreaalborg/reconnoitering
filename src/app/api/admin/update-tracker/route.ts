// src/app/api/admin/update-tracker/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    await dbConnect();
    
    // Group exhibitions by location name and get the last updated date
    const updateStatus = await Exhibition.aggregate([
      {
        $group: {
          _id: '$location.name',
          lastUpdated: { $max: '$lastUpdated' },
          city: { $first: '$location.city' },
          country: { $first: '$location.country' },
          exhibitionCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          locationName: '$_id',
          lastUpdated: 1,
          city: 1,
          country: 1,
          exhibitionCount: 1,
          daysSinceUpdate: {
            $divide: [
              { $subtract: [new Date(), '$lastUpdated'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      },
      {
        $sort: { daysSinceUpdate: -1 } // Sort by most outdated first
      }
    ]);
    
    return NextResponse.json({ 
      success: true, 
      data: updateStatus
    });
  } catch (error: any) {
    console.error('Error fetching update status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch update status: ' + error.message },
      { status: 500 }
    );
  }
}