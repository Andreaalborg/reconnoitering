import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';

export async function GET(request: Request) {
  try {
    await dbConnect();
    
    const { searchParams } = new URL(request.url);
    
    // Standard filtreringsparametere
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const categoryFilter = searchParams.get('category');
    const artist = searchParams.get('artist');
    const searchText = searchParams.get('search');
    const sort = searchParams.get('sort') || '-addedDate';
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    
    // Bygg spørringsobjekt
    const query: any = {};
    
    // Tekstsøk (full-tekst søk)
    if (searchText) {
      query.$text = { $search: searchText };
    }
    
    // Lokasjonsfiltere
    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (country) query['location.country'] = { $regex: country, $options: 'i' };
    
    // Datofiltere
    if (startDate || endDate) {
      query.$and = [];
      
      if (startDate) {
        query.$and.push({ endDate: { $gte: new Date(startDate) } });
      }
      
      if (endDate) {
        query.$and.push({ startDate: { $lte: new Date(endDate) } });
      }
    }
    
    // Kategori- og artistfiltere
    if (categoryFilter) {
      query.category = { $regex: categoryFilter, $options: 'i' };
    }
    
    if (artist) {
      query.artists = { $regex: artist, $options: 'i' };
    }
    
    // Definer sorteringsalternativer
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
    
    // Hent utstillinger
    const exhibitions = await Exhibition.find(query)
      .sort(sortOption)
      .limit(limit)
      .skip(skip);
      
    const total = await Exhibition.countDocuments(query);
    
    // Hent unike verdier for filterene (for søkesiden)
    const uniqueCities = await Exhibition.distinct('location.city');
    const uniqueCountries = await Exhibition.distinct('location.country');
    const uniqueCategories = await Exhibition.distinct('category');
    
    return NextResponse.json({ 
      success: true, 
      data: exhibitions,
      meta: {
        total,
        filter_options: {
          cities: uniqueCities,
          countries: uniqueCountries,
          categories: uniqueCategories.flat()
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exhibitions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    
    const body = await request.json();
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