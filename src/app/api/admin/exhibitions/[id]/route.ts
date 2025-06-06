import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';
import Venue from '@/models/Venue'; // Viktig for populate
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { NextAuthOptions } from 'next-auth';
import mongoose from 'mongoose';

// GET: Hent en spesifikk utstilling (for admin-bruk)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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
    // Sikre at modeller er registrert
    const _Venue = mongoose.models.Venue || mongoose.model('Venue');
    const _Exhibition = mongoose.models.Exhibition || mongoose.model('Exhibition');
    
    const id = params.id;
    console.log(`Admin henter exhibition med ID: ${id}`);

    // Valider ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
       return NextResponse.json({ success: false, error: 'Ugyldig Exhibition ID format' }, { status: 400 });
    }
    
    const exhibition = await _Exhibition.findById(id)
       .populate<{ venue: typeof Venue }>({
          path: 'venue',
          select: 'name city country address'
       })
       .lean();
       
    if (!exhibition) {
      return NextResponse.json(
        { success: false, error: 'Utstilling ikke funnet' },
        { status: 404 }
      );
    }

    console.log("Funnet utstilling (med venue):", exhibition);
    return NextResponse.json({ success: true, data: exhibition });
  } catch (error: any) {
    console.error('Feil ved henting av utstilling:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Kunne ikke hente utstilling' },
      { status: 500 }
    );
  }
}

// PUT: Oppdater en spesifikk utstilling (for admin-bruk)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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
    // Sikre at modeller er registrert
    const _Exhibition = mongoose.models.Exhibition || mongoose.model('Exhibition');
    
    const id = params.id;
    const body = await request.json();
    console.log(`Admin oppdaterer exhibition ${id} med data:`, body);
    
    // Valider ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
       return NextResponse.json({ success: false, error: 'Ugyldig Exhibition ID format for oppdatering' }, { status: 400 });
    }
    
    // Valider påkrevde felt (venueId trengs ikke nødvendigvis her hvis det ikke skal endres?)
    const { title, startDate, endDate, venueId, ...optionalFields } = body; // Trekk ut venueId hvis den sendes med
    if (!title || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Tittel, Startdato og Sluttdato er påkrevd' },
        { status: 400 }
      );
    }

    // Lag oppdateringsdata (ikke ta med venueId hvis den ikke skal endres)
    const updateData: any = {
        title,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        lastUpdated: new Date(),
        ...optionalFields
    };
    // Kun oppdater venue hvis en ny venueId er sendt med
    if (venueId) {
        updateData.venue = venueId;
    }

    // Finn og oppdater utstillingen
    const updatedExhibition = await _Exhibition.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    if (!updatedExhibition) {
      return NextResponse.json(
        { success: false, error: 'Utstilling ikke funnet for oppdatering' },
        { status: 404 }
      );
    }

    console.log("Oppdatert utstilling:", updatedExhibition);
    return NextResponse.json({ 
      success: true, 
      data: updatedExhibition,
      message: 'Utstilling oppdatert' 
    });
  } catch (error: any) {
    console.error('Feil ved oppdatering av utstilling:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    // Håndter valideringsfeil
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((el: any) => el.message);
      return NextResponse.json(
        { success: false, error: `Valideringsfeil: ${messages.join(', ')}` },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: error.message || 'Kunne ikke oppdatere utstilling' },
      { status: 500 }
    );
  }
}

// DELETE: Slett en spesifikk utstilling (for admin-bruk)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
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
    // Sikre at modeller er registrert
    const _Exhibition = mongoose.models.Exhibition || mongoose.model('Exhibition');

    const id = params.id;
    console.log(`Admin sletter exhibition med ID: ${id}`);

    // Valider ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
       return NextResponse.json({ success: false, error: 'Ugyldig Exhibition ID format for sletting' }, { status: 400 });
    }
    
    const deletedExhibition = await _Exhibition.findByIdAndDelete(id);

    if (!deletedExhibition) {
      return NextResponse.json(
        { success: false, error: 'Utstilling ikke funnet for sletting' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Utstilling slettet'
    });
  } catch (error: any) {
    console.error('Feil ved sletting av utstilling:', error);
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Kunne ikke slette utstilling' },
      { status: 500 }
    );
  }
} 