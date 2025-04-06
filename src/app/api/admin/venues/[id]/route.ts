import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Venue from '@/models/Venue';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import Exhibition from '@/models/Exhibition';
import { NextAuthOptions } from 'next-auth';
import mongoose from 'mongoose';

// GET: Hent et spesifikt venue
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Sjekk admin-tilgang
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    await dbConnect();
    
    const id = context.params.id;
    console.log(`Admin henter venue med ID: ${id}`);

    // Valider ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Ugyldig Venue ID format' }, { status: 400 });
    }
    
    const venue = await Venue.findById(id).lean();
    if (!venue) {
      return NextResponse.json(
        { success: false, error: 'Venue ikke funnet' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: venue });
  } catch (error: any) {
    console.error('Feil ved henting av venue:', error);
    return NextResponse.json(
      { success: false, error: 'Kunne ikke hente venue' },
      { status: 500 }
    );
  }
}

// PUT: Oppdater et spesifikt venue
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Sjekk admin-tilgang
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    await dbConnect();
    const id = context.params.id;

    // Valider ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Ugyldig Venue ID format for oppdatering' }, { status: 400 });
    }
    
    const body = await request.json();
    
    // Valider påkrevde felt
    if (!body.name || !body.location?.city || !body.location?.country) {
      return NextResponse.json(
        { success: false, error: 'Navn, by og land er påkrevd' },
        { status: 400 }
      );
    }

    // Finn og oppdater venue
    const updatedVenue = await Venue.findByIdAndUpdate(
      id,
      { 
        ...body,
        lastUpdated: new Date()
      },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedVenue) {
      return NextResponse.json(
        { success: false, error: 'Venue ikke funnet' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      data: updatedVenue,
      message: 'Venue oppdatert' 
    });
  } catch (error: any) {
    console.error('Feil ved oppdatering av venue:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Kunne ikke oppdatere venue'
      },
      { status: 500 }
    );
  }
}

// DELETE: Slett et spesifikt venue
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Sjekk admin-tilgang
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    await dbConnect();
    const id = context.params.id;

    // Valider ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ success: false, error: 'Ugyldig Venue ID format for sletting' }, { status: 400 });
    }

    // Sjekk om venue er i bruk av noen utstillinger
    const venue = await Venue.findById(id);
    if (!venue) {
      return NextResponse.json(
        { success: false, error: 'Venue ikke funnet' },
        { status: 404 }
      );
    }

    // TODO: Når Exhibition-modellen er implementert, legg til sjekk her
    // const hasExhibitions = await Exhibition.exists({ 'location._id': id });
    
    // if (hasExhibitions) {
    //   // Hvis venue er i bruk, merk det som inaktivt i stedet for å slette
    //   venue.isActive = false;
    //   await venue.save();
    //   return NextResponse.json({
    //     success: true,
    //     message: 'Venue er i bruk av utstillinger og har blitt markert som inaktiv'
    //   });
    // }

    // Hvis venue ikke er i bruk, slett det
    await Venue.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Venue slettet'
    });
  } catch (error: any) {
    console.error('Feil ved sletting av venue:', error);
    return NextResponse.json(
      { success: false, error: 'Kunne ikke slette venue' },
      { status: 500 }
    );
  }
} 