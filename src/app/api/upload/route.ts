import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { NextAuthOptions } from 'next-auth';

export async function POST(request: NextRequest) {
  try {
    // Sjekk autentisering
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session?.user?.role || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Ikke autorisert' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Ingen fil funnet' },
        { status: 400 }
      );
    }

    // Valider filtype
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Kun bilder er tillatt' },
        { status: 400 }
      );
    }

    // Valider filstørrelse (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Filstørrelsen overstiger 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generer unikt filnavn
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `${uniqueSuffix}-${file.name}`;
    
    // Lagre filen i public/uploads
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);
    
    await writeFile(filepath, buffer);
    
    // Returner URL til den opplastede filen
    const imageUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      data: { url: imageUrl }
    });

  } catch (error) {
    console.error('Feil ved bildeopplasting:', error);
    return NextResponse.json(
      { success: false, error: 'Kunne ikke laste opp bilde' },
      { status: 500 }
    );
  }
} 