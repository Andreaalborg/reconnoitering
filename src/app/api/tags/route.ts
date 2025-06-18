import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';

export async function GET() {
  try {
    await dbConnect();

    // Aggregate to get all unique tags with their counts
    const tagsData = await Exhibition.aggregate([
      { $match: { status: 'Active' } },
      { $unwind: '$tags' },
      { $group: { 
        _id: '$tags',
        count: { $sum: 1 }
      }},
      { $sort: { count: -1 } },
      { $project: {
        _id: 1,
        name: '$_id',
        count: 1
      }}
    ]);

    return NextResponse.json(tagsData);
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tags' },
      { status: 500 }
    );
  }
}