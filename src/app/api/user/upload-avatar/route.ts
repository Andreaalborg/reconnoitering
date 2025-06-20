import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { NextAuthOptions } from 'next-auth';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    // Check authentication - any logged in user can upload their avatar
    const session = await getServerSession(authOptions as NextAuthOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file found' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Only JPEG, PNG, GIF and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (2MB for avatars)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size exceeds 2MB limit' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate unique filename using user email hash
    const emailHash = Buffer.from(session.user.email).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 10);
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop() || 'jpg';
    const filename = `avatar-${emailHash}-${timestamp}.${fileExt}`;
    
    // Ensure avatars directory exists
    const avatarsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    if (!existsSync(avatarsDir)) {
      await mkdir(avatarsDir, { recursive: true });
    }
    
    const filepath = join(avatarsDir, filename);
    
    await writeFile(filepath, buffer);
    
    // Return URL to the uploaded file
    const imageUrl = `/uploads/avatars/${filename}`;
    
    return NextResponse.json({ 
      success: true, 
      url: imageUrl
    });

  } catch (error) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}