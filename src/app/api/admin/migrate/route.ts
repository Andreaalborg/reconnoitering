import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';
import Venue from '@/models/Venue';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting migration...');
    await dbConnect();
    console.log('Connected to database');
    
    // Registrer Venue-modellen hvis den ikke allerede er registrert
    if (!mongoose.models.Venue) {
      mongoose.model('Venue', Venue.schema);
    }
    
    // Hent alle utstillinger som mangler location-felter
    const exhibitions = await Exhibition.find({
      $or: [
        { location: { $exists: false } },
        { 'location.city': { $exists: false } },
        { 'location.country': { $exists: false } }
      ]
    }).populate('venue');
    
    console.log(`Found ${exhibitions.length} exhibitions to migrate`);
    
    // Oppdater hver utstilling med location-felter fra venue
    const updatedExhibitions = await Promise.all(
      exhibitions.map(async (exhibition) => {
        try {
          console.log(`Processing exhibition ${exhibition._id}`);
          
          if (!exhibition.venue) {
            console.log(`Exhibition ${exhibition._id} has no venue, skipping`);
            return null;
          }
          
          const venue = exhibition.venue as any;
          console.log(`Venue data:`, venue);
          
          if (!venue.city || !venue.country) {
            console.log(`Venue ${venue._id} missing city or country, skipping`);
            return null;
          }
          
          exhibition.location = {
            city: venue.city,
            country: venue.country
          };
          
          const saved = await exhibition.save();
          console.log(`Successfully updated exhibition ${exhibition._id}`);
          return saved;
        } catch (error) {
          console.error(`Error processing exhibition ${exhibition._id}:`, error);
          return null;
        }
      })
    );
    
    const successfulUpdates = updatedExhibitions.filter(Boolean).length;
    console.log(`Migration complete. Updated ${successfulUpdates} exhibitions`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${successfulUpdates} exhibitions`,
      total: exhibitions.length,
      updated: successfulUpdates
    });
    
  } catch (error) {
    console.error('Error in migration:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to migrate exhibitions',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 