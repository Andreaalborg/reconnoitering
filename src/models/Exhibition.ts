// src/models/Exhibition.ts - Updated model with closedDay field

import mongoose, { Schema, Document } from 'mongoose';

export interface IExhibition extends Document {
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  startDate: Date;
  endDate: Date;
  location: {
    name: string;
    address?: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  category: string[];
  artists: string[];
  tags: string[];
  ticketPrice?: string;
  ticketUrl?: string;
  websiteUrl?: string;
  addedDate: Date;
  lastUpdated: Date; // New field to track when the exhibition was last updated
  popularity: number;
  featured: boolean;
  closedDay?: string; // New field for the day of the week when the exhibition is closed
}

const ExhibitionSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Please provide a title for the exhibition'],
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
  },
  coverImage: {
    type: String,
    required: [true, 'Please provide a cover image URL'],
  },
  images: [String],
  startDate: {
    type: Date,
    required: [true, 'Please provide a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide an end date'],
  },
  location: {
    name: {
      type: String,
      required: [true, 'Please provide a location name'],
    },
    address: String,
    city: {
      type: String,
      required: [true, 'Please provide a city'],
    },
    country: {
      type: String,
      required: [true, 'Please provide a country'],
    },
    coordinates: {
      lat: Number,
      lng: Number,
    }
  },
  category: [String],
  artists: [String],
  tags: [String],
  ticketPrice: String,
  ticketUrl: String,
  websiteUrl: String,
  addedDate: {
    type: Date,
    default: Date.now,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
  popularity: {
    type: Number,
    default: 0,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  closedDay: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', null],
    default: null
  }
});

// Text indexes for search
ExhibitionSchema.index({ 
  title: 'text', 
  description: 'text', 
  'location.name': 'text', 
  'location.city': 'text', 
  'location.country': 'text', 
  artists: 'text',
  category: 'text', 
  tags: 'text'
});

// Update the lastUpdated field when an exhibition is modified
ExhibitionSchema.pre('findOneAndUpdate', function() {
  this.set({ lastUpdated: new Date() });
});

// Use mongoose.models to check if the model already exists or create a new one
export default mongoose.models.Exhibition || 
  mongoose.model<IExhibition>('Exhibition', ExhibitionSchema);


// src/app/api/exhibitions/date/route.ts - Updated to support closedDay information

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
    const closedDay = searchParams.get('closedDay');
    
    // Build the query
    const query: any = {
      // Find exhibitions that span the selected date
      // (start date is on or before the selected date AND end date is on or after the selected date)
      startDate: { $lte: searchDate },
      endDate: { $gte: searchDate }
    };
    
    // Add optional filters
    if (city) query['location.city'] = { $regex: new RegExp(city, 'i') };
    if (category) query.category = { $regex: new RegExp(category, 'i') };
    
    // Handle closedDay filter
    if (closedDay) {
      if (closedDay === 'none') {
        // Find exhibitions that are open every day (no closed day)
        query.closedDay = null;
      } else {
        // Find exhibitions that are closed on the specified day
        query.closedDay = closedDay;
      }
    }
    
    // Check if the day of the week for the search date matches any exhibition's closed day
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = daysOfWeek[searchDate.getDay()];
    
    // Execute the query
    const exhibitions = await Exhibition.find(query).lean();
    
    // Add a flag for each exhibition to indicate if it's closed on the search date
    const exhibitionsWithStatus = exhibitions.map(ex => {
      const isClosedOnSearchDate = ex.closedDay === dayOfWeek;
      return {
        ...ex,
        isClosedOnSearchDate
      };
    });
    
    // Get unique cities and categories for filters
    const uniqueCities = await Exhibition.distinct('location.city');
    const allCategories = await Exhibition.distinct('category');
    
    // Flatten the categories array since it's a nested array of arrays
    const uniqueCategories = Array.from(new Set(allCategories.flat()));
    
    return NextResponse.json({
      success: true,
      data: exhibitionsWithStatus,
      meta: {
        date: dateParam,
        dayOfWeek: dayOfWeek,
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


// src/app/api/admin/update-tracker/route.ts - New API to track museum update status
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