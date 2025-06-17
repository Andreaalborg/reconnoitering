import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Venue from '@/models/Venue';

// GET: List all active venues (public route)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    
    // Base query - only active venues for public API
    const query: any = { isActive: true, 'coordinates.lat': { $ne: null }, 'coordinates.lng': { $ne: null } };
    
    // Apply text search if present
    const searchText = searchParams.get('q');
    if (searchText) {
      query.$text = { $search: searchText };
    }
    
    // Apply country filter
    const country = searchParams.get('country');
    if (country) {
      query.country = country;
    }
    
    // Apply city filter
    const city = searchParams.get('city');
    if (city) {
      query.city = city;
    }
    
    // Sorting logic
    const sort = searchParams.get('sort') || 'name';
    let sortOption: any = {};
    
    // If using text search, let text score influence sorting
    if (searchText) {
      sortOption = { score: { $meta: "textScore" } };
    } else {
      // Otherwise, sort normally
      switch (sort) {
        case 'name':
        default:
          sortOption = { name: 1 };
          break;
        case '-name':
          sortOption = { name: -1 };
          break;
        case 'country':
          sortOption = { country: 1 };
          break;
        case '-country':
          sortOption = { country: -1 };
          break;
        case 'city':
          sortOption = { city: 1 };
          break;
        case '-city':
          sortOption = { city: -1 };
      }
    }
    
    // Pagination logic
    const limit = parseInt(searchParams.get('limit') || '200'); // Higher default limit for venues
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Fetch venues
    const venues = await Venue.find(query)
      .select('_id name city country coordinates')
      .sort(sortOption)
      .limit(limit)
      .skip(skip)
      .lean();
      
    const total = await Venue.countDocuments(query);
    
    // --- Fetching Filter Options ---
    const uniqueCountries = await Venue.distinct('country', { isActive: true });
    const uniqueCities = await Venue.distinct('city', { isActive: true });
    
    return NextResponse.json({ 
      success: true, 
      data: venues,
      meta: {
        total,
        filter_options: {
          countries: uniqueCountries.sort(),
          cities: uniqueCities.sort()
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching public venues:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch venues' },
      { status: 500 }
    );
  }
} 