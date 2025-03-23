import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    
    // Get date parameter - this is required
    const dateParam = searchParams.get('date');
    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }
    
    // Parse date and create start/end of the day
    const searchDate = new Date(dateParam);
    
    // Check if date is valid
    if (isNaN(searchDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Optional filters
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    
    // Build the query
    const query: any = {
      // Find exhibitions that span the selected date
      // (start date is on or before the selected date AND end date is on or after the selected date)
      startDate: { $lte: searchDate },
      endDate: { $gte: searchDate }
    };
    
    // Add optional filters
    if (city) {
      query['location.city'] = { $regex: new RegExp(city, 'i') };
    }
    
    if (category) {
      query.category = { $regex: new RegExp(category, 'i') };
    }
    
    // Execute the query
    const exhibitions = await Exhibition.find(query).lean();
    
    // Get unique cities and categories for filters
    const uniqueCities = await Exhibition.distinct('location.city');
    const allCategories = await Exhibition.distinct('category');
    
    // Flatten the categories array since it's a nested array of arrays
    const uniqueCategories = Array.from(new Set(allCategories.flat()));
    
    return NextResponse.json({
      success: true,
      data: exhibitions,
      meta: {
        date: dateParam,
        total: exhibitions.length,
        filter_options: {
          cities: uniqueCities,
          categories: uniqueCategories
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching exhibitions by date:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exhibitions: ' + error.message },
      { status: 500 }
    );
  }
}