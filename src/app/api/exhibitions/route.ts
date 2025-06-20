import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';
import Venue from '@/models/Venue';
import mongoose from 'mongoose';
import * as Sentry from '@sentry/nextjs';

export const dynamic = 'force-dynamic'; // Opt out of caching

// --- Define European Countries ---
// Note: This list might need refinement based on specific definitions (e.g., including transcontinental countries)
const EUROPEAN_COUNTRIES = [
  "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina", "Bulgaria", 
  "Croatia", "Cyprus", "Czech Republic", "Denmark", "Estonia", "Finland", "France", 
  "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia", 
  "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro", 
  "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia", // Consider if Russia should be included/partially included
  "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland", 
  "Turkey", // Consider if Turkey should be included/partially included
  "Ukraine", "United Kingdom", "UK", "Vatican City"
  // Add or remove countries as needed
];
// Normalize UK variations
const EUROPEAN_COUNTRIES_NORMALIZED = EUROPEAN_COUNTRIES.map(c => c.toLowerCase());

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Registrer Venue-modellen hvis den ikke allerede er registrert
    if (!mongoose.models.Venue) {
      mongoose.model('Venue', Venue.schema);
    }
    
    const { searchParams } = new URL(request.url);
    
    // Base query: Gjør location-filter valgfritt
    const query: any = {};

    // Legg til logging for debugging
    console.log('Initial query:', query);

    // Apply text search if present
    const searchText = searchParams.get('q');
    if (searchText) {
      query.$text = { $search: searchText };
    }
    
    // --- Upcoming Filter ---
    const upcoming = searchParams.get('upcoming');
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to the beginning of today
      query.startDate = { $gte: today };
    }
    
    // Apply selected countries filter (overrides base Europe filter if present)
    let selectedCountryValues: string[] = [];
    const countriesParam = searchParams.get('countries');
    if (countriesParam) {
      selectedCountryValues = countriesParam.split(',').map(c => c.trim()).filter(Boolean);
      if (selectedCountryValues.length > 0) {
        const validSelectedCountries = selectedCountryValues.filter(c => 
            EUROPEAN_COUNTRIES.some(ec => ec.toLowerCase() === c.toLowerCase()));
        if (validSelectedCountries.length > 0) {
          query['location.country'] = { $in: validSelectedCountries };
        }
      }
    }

    // Legg til logging for debugging
    console.log('Query after country filter:', query);

    // Apply selected cities filter 
    const citiesParam = searchParams.get('cities');
    const cityParam = searchParams.get('city');

    if (citiesParam) {
        const cityList = citiesParam.split(',').map(c => c.trim()).filter(Boolean);
        if (cityList.length > 0) {
            query['location.city'] = { $in: cityList.map(city => new RegExp(`^${city}$`, 'i')) };
        }
    } else if (cityParam) {
        query['location.city'] = { $regex: new RegExp(`^${cityParam}$`, 'i') };
    }

    // Legg til logging for debugging
    console.log('Final query:', query);

    // Apply other filters (Category, Artist, Tag)
    const category = searchParams.get('category');
    if (category) { query.category = { $regex: new RegExp(`^${category}$`, 'i') }; }
    const artist = searchParams.get('artist');
    if (artist) { query.artists = { $regex: new RegExp(`^${artist}$`, 'i') }; }
    const tag = searchParams.get('tag');
    if (tag) { query.tags = { $regex: new RegExp(`^${tag}$`, 'i') }; }
    
    // --- Date Range Filter --- 
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    if (startDateParam && endDateParam) {
      // Validate dates (optional but recommended)
      try {
        const searchStart = new Date(startDateParam);
        const searchEnd = new Date(endDateParam);
        searchEnd.setHours(23, 59, 59, 999); // Include the entire end day

        query.startDate = { $lte: searchEnd }; // Exhibition must start before or on search end date
        query.endDate = { $gte: searchStart }; // Exhibition must end on or after search start date
      } catch (dateError) {
        console.error("Invalid date format received:", startDateParam, endDateParam);
        // Decide how to handle invalid dates - return error or ignore?
        // For now, we ignore the date filter if format is bad
      }
    } else if (startDateParam) {
      // Handle case where only startDate is provided (interpret as single day search)
       try {
        const searchDate = new Date(startDateParam);
        const searchStart = new Date(searchDate);
        searchStart.setHours(0, 0, 0, 0); 
        const searchEnd = new Date(searchDate);
        searchEnd.setHours(23, 59, 59, 999); 

        query.startDate = { $lte: searchEnd }; // Exhibition must start before or on this day
        query.endDate = { $gte: searchStart }; // Exhibition must end on or after this day
      } catch (dateError) {
         console.error("Invalid date format received for single day:", startDateParam);
      }
    }
    // --------------------------

    // Sorting logic (adjust based on $text search)
    const sort = searchParams.get('sort') || '-addedDate';
    let sortOption: any = {};
    
    // Hvis vi bruker tekstsøk, la tekstscore påvirke sorteringen
    if (searchText) {
      sortOption = { score: { $meta: "textScore" } };
    } else {
      // Ellers, sorter som vanlig
      switch (sort) {
        case 'startDate':
          sortOption = { startDate: 1 };
          break;
        case '-startDate':
          sortOption = { startDate: -1 };
          break;
        case 'popularity':
          sortOption = { popularity: 1 };
          break;
        case '-popularity':
          sortOption = { popularity: -1 };
          break;
        case 'title':
          sortOption = { title: 1 };
          break;
        case '-title':
          sortOption = { title: -1 };
          break;
        case 'addedDate':
          sortOption = { addedDate: 1 };
          break;
        case '-addedDate':
        default:
          sortOption = { addedDate: -1 };
      }
    }
    
    // Pagination logic (remains the same)
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Hent utstillinger
    const exhibitions = await Exhibition.find(query)
      .populate('venue')
      .sort(sortOption)
      .limit(limit)
      .skip(skip);
      
    const total = await Exhibition.countDocuments(query);
    
    // Legg til logging for debugging
    console.log('Found exhibitions:', exhibitions.length);
    console.log('Total count:', total);

    // --- Fetching Filter Options (Context-Aware) ---
    
    // Base query for fetching filter options (start with current filters)
    const filterOptionQueryBase = { ...query };

    // Fetch City options: Based on ALL current filters EXCEPT city itself
    delete filterOptionQueryBase['location.city']; 
    const uniqueCities = await Exhibition.distinct('location.city', filterOptionQueryBase);
    
    // Fetch Category options: Based on ALL current filters EXCEPT category
    const categoryFilterQuery = { ...query }; // Re-clone original query
    delete categoryFilterQuery.category;
    const uniqueCategories = await Exhibition.distinct('category', categoryFilterQuery);

    // Fetch Artist options: Based on ALL current filters EXCEPT artist
    const artistFilterQuery = { ...query };
    delete artistFilterQuery.artists;
    const uniqueArtists = await Exhibition.distinct('artists', artistFilterQuery);

    // Fetch Tag options: Based on ALL current filters EXCEPT tag
    const tagFilterQuery = { ...query };
    delete tagFilterQuery.tags;
    const uniqueTags = await Exhibition.distinct('tags', tagFilterQuery);
    
    return NextResponse.json({ 
      success: true, 
      data: exhibitions,
      meta: {
        total,
        filter_options: {
          cities: uniqueCities.sort(), 
          countries: EUROPEAN_COUNTRIES, 
          categories: Array.from(new Set(uniqueCategories.flat())).sort(),
          artists: Array.from(new Set(uniqueArtists.flat())).sort(),
          tags: Array.from(new Set(uniqueTags.flat())).sort()
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    Sentry.captureException(error, {
      tags: { api: 'exhibitions-get' },
      extra: { errorMessage: error instanceof Error ? error.message : 'Unknown error' }
    });
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch exhibitions'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
    
    // Hent venue for å få location-feltene
    const venue = await mongoose.model('Venue').findById(body.venue);
    if (!venue) {
      return NextResponse.json(
        { success: false, error: 'Venue not found' },
        { status: 404 }
      );
    }
    
    // Kopier location-feltene fra venue
    body.location = {
      city: venue.city,
      country: venue.country
    };
    
    const exhibition = await Exhibition.create(body);
    
    return NextResponse.json({ 
      success: true, 
      data: exhibition 
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating exhibition:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create exhibition' },
      { status: 500 }
    );
  }
}