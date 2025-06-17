import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Venue from '@/models/Venue';
import Exhibition from '@/models/Exhibition';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { NextAuthOptions } from 'next-auth';
import mongoose from 'mongoose';

// POST: Opprett en ny utstilling
export async function POST(request: NextRequest) {
  try {
    // 1. Sjekk autentisering og admin-rettigheter
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    // 2. Koble til databasen
    await dbConnect();

    // 3. Hent data fra request body
    const body = await request.json();
    console.log("Mottatt data for ny utstilling:", body); // Debug log

    // 4. Valider påkrevde felt (spesielt venueId)
    const { title, venueId, startDate, endDate, ...optionalFields } = body;
    if (!title || !venueId || !startDate || !endDate) {
       console.error('Valideringsfeil: Mangler påkrevde felt', { title, venueId, startDate, endDate });
      return NextResponse.json(
        { success: false, error: 'Tittel, Venue, Startdato og Sluttdato er påkrevd' },
        { status: 400 }
      );
    }

    // 5. Opprett nytt Exhibition-dokument
    const newExhibitionData = {
      title,
      venue: venueId, // Koble til Venue via ID
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      addedDate: new Date(),
      lastUpdated: new Date(),
      ...optionalFields, // Inkluder alle andre mottatte felt (description, imageUrl etc.)
    };

     console.log("Oppretter utstilling med data:", newExhibitionData);
    const exhibition = new Exhibition(newExhibitionData);
    
    // 6. Lagre til databasen
    await exhibition.save();
    console.log("Utstilling lagret med ID:", exhibition._id);

    // 7. Returner suksessrespons med den nye utstillingen
    return NextResponse.json({ success: true, data: exhibition }, { status: 201 });

  } catch (error: any) {
    console.error('Feil ved opprettelse av utstilling:', error);

    // Håndter spesifikke Mongoose valideringsfeil
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((el: any) => el.message);
      return NextResponse.json(
        { success: false, error: `Valideringsfeil: ${messages.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Generell serverfeil
    return NextResponse.json(
      { success: false, error: error.message || 'Kunne ikke opprette utstilling' },
      { status: 500 }
    );
  }
}

// GET: Hent alle utstillinger (for admin-bruk)
export async function GET(request: NextRequest) {
  try {
    // 1. Sjekk autentisering og admin-rettigheter
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    // 2. Koble til databasen
    await dbConnect();

    // *** Hent modeller direkte fra mongoose.models ***
    const ExhibitionModel = mongoose.models.Exhibition || mongoose.model('Exhibition', Exhibition.schema);
    const VenueModel = mongoose.models.Venue || mongoose.model('Venue', Venue.schema); // Sørg for at Venue også hentes/registreres
    console.log("Modeller hentet fra mongoose.models: Exhibition, Venue");

    // 3. Hent utstillinger MED populate (bruk hentet modell)
    console.log("Henter exhibitions MED populate (bruker mongoose.models)...");
    const exhibitions = await ExhibitionModel.find({}) // Bruk ExhibitionModel
      .sort({ addedDate: -1 })
      .populate<{ venue: typeof Venue }>({ // Type hint for populate er fortsatt nyttig
          path: 'venue',
          model: VenueModel, // Spesifiser modellen eksplisitt her!
          select: 'name city country address'
      })
      .lean();
    console.log(`Fant ${exhibitions.length} exhibitions (med populate).`);

    // 4. Returner suksessrespons
    return NextResponse.json({ success: true, data: exhibitions });

  } catch (error: any) {
    console.error('Feil ved henting av utstillinger:', error);
    // Logg mer detaljer om feilen
    console.error('Error Name:', error.name);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Kunne ikke hente utstillinger' },
      { status: 500 }
    );
  }
}

// GET-metode (kan legges til senere for å liste utstillinger, hvis nødvendig)
// export async function GET(request: NextRequest) {
//   // ... logikk for å hente utstillinger ...
// } 