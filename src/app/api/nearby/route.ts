import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';

// Constants
const EARTH_RADIUS = 6371; // Radius of the earth in km

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    
    // Get coordinates and radius from query params
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '10'); // Default radius: 10km
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid latitude and longitude are required' },
        { status: 400 }
      );
    }
    
    // MongoDB Geospatial query using $geoNear
    // This requires a geospatial index on the coordinates field
    // Here we're assuming a simple approach, but in a production app,
    // you would use proper MongoDB geospatial queries
    const exhibitions = await Exhibition.find({
      'location.coordinates': { $exists: true }
    });
    
    // Calculate distance for each exhibition and filter by radius
    const nearbyExhibitions = exhibitions
      .filter(ex => {
        if (!ex.location.coordinates?.lat || !ex.location.coordinates?.lng) {
          return false;
        }
        
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          lat, lng,
          ex.location.coordinates.lat,
          ex.location.coordinates.lng
        );
        
        // Add distance to the exhibition object
        ex._doc.distance = parseFloat(distance.toFixed(1));
        
        // Filter by radius
        return distance <= radius;
      })
      // Sort by distance (closest first)
      .sort((a, b) => a._doc.distance - b._doc.distance);
    
    return NextResponse.json({ 
      success: true, 
      data: nearbyExhibitions,
      meta: {
        userLocation: { lat, lng },
        radius,
        total: nearbyExhibitions.length
      }
    });
    
  } catch (error: any) {
    console.error('Error fetching nearby exhibitions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch nearby exhibitions: ' + error.message },
      { status: 500 }
    );
  }
}

// Haversine formula to calculate distance between two coordinates in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS * c; // Distance in km
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}