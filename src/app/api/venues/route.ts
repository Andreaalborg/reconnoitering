import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Venue from '@/models/Venue';
import Exhibition from '@/models/Exhibition';

// GET: List all active venues (public route)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    
    // Check if we want detailed info (for map view)
    const includeDetails = searchParams.get('includeDetails') === 'true';
    
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
    
    // Select fields based on detail level
    const selectFields = includeDetails 
      ? '_id name city country coordinates address websiteUrl defaultClosedDays'
      : '_id name city country coordinates';
    
    // Fetch venues
    const venues = await Venue.find(query)
      .select(selectFields)
      .sort(sortOption)
      .limit(limit)
      .skip(skip)
      .lean();
      
    // If includeDetails is true, fetch current exhibitions for each venue
    let venuesWithDetails = venues;
    if (includeDetails) {
      const today = new Date();
      const venueIds = venues.map(v => v._id);
      
      // Fetch current exhibitions for all venues
      const exhibitions = await Exhibition.find({
        venue: { $in: venueIds },
        startDate: { $lte: today },
        endDate: { $gte: today }
      })
      .select('title venue startDate endDate imageUrl')
      .lean();
      
      // Group exhibitions by venue
      const exhibitionsByVenue = exhibitions.reduce((acc: any, exhibition) => {
        const venueId = exhibition.venue.toString();
        if (!acc[venueId]) acc[venueId] = [];
        acc[venueId].push(exhibition);
        return acc;
      }, {});
      
      // Add exhibitions to venues
      venuesWithDetails = venues.map((venue: any) => ({
        ...venue,
        currentExhibitions: exhibitionsByVenue[venue._id.toString()] || [],
        exhibitionCount: (exhibitionsByVenue[venue._id.toString()] || []).length
      }));
    }
      
    const total = await Venue.countDocuments(query);
    
    // --- Fetching Filter Options ---
    const uniqueCountries = await Venue.distinct('country', { isActive: true });
    const uniqueCities = await Venue.distinct('city', { isActive: true });
    
    return NextResponse.json({ 
      success: true, 
      data: venuesWithDetails,
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