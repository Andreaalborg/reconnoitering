import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Venue from '@/models/Venue';
import Exhibition from '@/models/Exhibition';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { NextAuthOptions } from 'next-auth';
import mongoose from 'mongoose';

// Helper function to check if the user is an admin
async function isAdmin() {
  try {
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session?.user) {
      console.log('Ingen session funnet');
      return false;
    }
    console.log('Session bruker:', session.user);
    return session.user.role === 'admin';
  } catch (error) {
    console.error('Feil ved admin-sjekk:', error);
    return false;
  }
}

// GET: List all venues (admin only) with exhibitions
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin
    const adminCheck = await isAdmin();
    console.log('Admin sjekk resultat:', adminCheck);
    
    if (!adminCheck) {
      return NextResponse.json(
        { success: false, error: 'Admin access required to view venues' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    
    // Bygg match-pipeline for filtrering
    const matchStage: any = {};
    const active = searchParams.get('active');
    if (active !== null) matchStage.isActive = active === 'true';
    const searchText = searchParams.get('q');
    // $text search må håndteres spesifikt i pipeline
    const country = searchParams.get('country');
    if (country) matchStage.country = country;
    const city = searchParams.get('city');
    if (city) matchStage.city = city;

    // Bygg sort-pipeline 
    const sortParam = searchParams.get('sort') || 'name'; 
    let sortStage: any = {};
     if (searchText) { // Hvis vi søker med tekst, sorter etter relevans først
      sortStage = { score: { $meta: "textScore" } };
      // Legg til sekundær sortering hvis ønskelig, f.eks. navn
      sortStage.name = 1;
    } else {
        const sortOrder = sortParam.startsWith('-') ? -1 : 1;
        const sortField = sortParam.replace(/^\-/, '');
        if (['name', 'city', 'country', 'addedDate', 'lastUpdated'].includes(sortField)) {
             sortStage[sortField] = sortOrder;
        } else {
            sortStage['name'] = 1; 
        }
    }

    // Pagination (som før)
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = parseInt(searchParams.get('skip') || '0');

    // Aggregation Pipeline
    const pipeline: any[] = []; // Definer type for pipeline

    // 1. Match (Håndter $text search først hvis det finnes)
    if (searchText) {
        pipeline.push({ $match: { $text: { $search: searchText } } });
    }
    if (Object.keys(matchStage).length > 0) { // Legg til andre match-kriterier
        pipeline.push({ $match: matchStage });
    }

    // 2. Slå opp relaterte utstillinger
    pipeline.push({
      $lookup: {
        from: Exhibition.collection.name, 
        localField: '_id',             
        foreignField: 'venue',         
        as: 'exhibitions',           
        pipeline: [
           { $project: { _id: 1, title: 1, startDate: 1, endDate: 1, addedDate: 1 } } // Hent datoer
           // Sortering fjernes herfra, gjøres i neste steg
        ]
      }
    });
    
    // 3. Behandle utstillingsdata
    pipeline.push({
        $addFields: {
            exhibitionCount: { $size: "$exhibitions" },
            // Finn siste sluttdato blant utstillingene
            lastExhibitionAddedDate: { $max: "$exhibitions.addedDate" },
            // Tell utstillinger som er avsluttet (endDate < nå)
            pastExhibitionsCount: {
                $size: {
                    $filter: {
                        input: "$exhibitions",
                        as: "ex",
                        cond: { $lt: [ "$$ex.endDate", new Date() ] }
                    }
                }
            }
        }
    });

    // 4. Sortering 
    pipeline.push({ $sort: sortStage });

    // 5. Klargjør for Faceted Search for å få både data og total count effektivt
    const facetStage = {
      $facet: {
        paginatedResults: [
          { $addFields: { lastUpdatedVenue: "$lastUpdated" } },
          { $skip: skip }, 
          { $limit: limit }
        ],
        totalCount: [
          { $count: 'count' }
        ]
      }
    };
    pipeline.push(facetStage);
    
    // Kjør aggregasjonen
    console.log("Kjører venue aggregation pipeline...", JSON.stringify(pipeline)); // Logg pipelinen
    const aggregationResult = await Venue.aggregate(pipeline).exec();
    console.log("Aggregation resultat:", aggregationResult);
    
    // Hent ut resultater og totalt antall
    const results = aggregationResult[0]?.paginatedResults || [];
    const totalDocs = aggregationResult[0]?.totalCount[0]?.count || 0;

    // --- Henting av filter options (som før, men basert på en separat query for ytelse) ---
    const uniqueCountries = await Venue.distinct('country').exec();
    const uniqueCities = await Venue.distinct('city').exec();
    // --- Slutt på filter options --- 

    return NextResponse.json({
      success: true,
      data: results, 
      meta: { 
          totalDocs,
          limit,
          skip,
          totalPages: Math.ceil(totalDocs / limit),
          filter_options: { 
             countries: uniqueCountries.sort(),
             cities: uniqueCities.sort()
          }
      } 
    });

  } catch (error: any) {
    console.error('Error fetching venues with exhibitions:', error);
    return NextResponse.json(
      { success: false, error: 'Could not fetch venues' },
      { status: 500 }
    );
  }
}

// POST: Create a new venue (admin only)
export async function POST(request: Request) {
  try {
    // Check if user is admin
    if (!await isAdmin()) {
      return NextResponse.json(
        { success: false, error: 'Admin access required to create venues' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const body = await request.json();
    console.log('Received venue data:', body);
    
    // Validate required fields
    if (!body.name || !body.city || !body.country) {
      return NextResponse.json(
        { success: false, error: 'Name, City, and Country are required fields' },
        { status: 400 }
      );
    }
    
    // Valider coordinates hvis de er tilstede
    if (body.coordinates) {
      if (typeof body.coordinates.lat !== 'number' || typeof body.coordinates.lng !== 'number') {
        return NextResponse.json(
          { success: false, error: 'Invalid coordinates' },
          { status: 400 }
        );
      }
    }
    
    // Opprett venue med validerte data
    const venue = await Venue.create({
      ...body,
      addedDate: new Date(),
      lastUpdated: new Date()
    });
    
    console.log('Successfully created venue:', venue);
    
    return NextResponse.json({ 
      success: true, 
      data: venue 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating venue:', error);
    
    // Hvis det er en MongoDB-valideringsfeil, returner mer spesifikk feilmelding
    if (error instanceof Error && error.name === 'ValidationError') {
      return NextResponse.json(
        { success: false, error: 'Validation Error: ' + error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: 'Could not create venue. Please check required fields.' },
      { status: 500 }
    );
  }
} 