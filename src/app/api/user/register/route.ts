import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/services/emailService';
import { validatePassword } from '@/utils/passwordValidation';
import { authRateLimiter } from '@/lib/rateLimiter';
import * as Sentry from '@sentry/nextjs';
import { validateInput, logValidationError } from '@/utils/validation';

export async function POST(request: Request) {
  try {
    // Get IP for rate limiting
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'unknown';
    
    // Check rate limit
    const isAllowed = await authRateLimiter.isAllowed(ip);
    if (!isAllowed) {
      const remainingTime = authRateLimiter.getRemainingTime(ip);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Too many registration attempts. Please try again later.',
          retryAfter: remainingTime 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': remainingTime.toString()
          }
        }
      );
    }
    
    await dbConnect();
    
    const body = await request.json();
    
    // Validate input
    const validation = validateInput<{ name: string; email: string; password: string }>(body, {
      name: {
        required: true,
        type: 'string',
        minLength: 2,
        maxLength: 50,
        sanitize: true
      },
      email: {
        required: true,
        type: 'email',
        maxLength: 100
      },
      password: {
        required: true,
        type: 'string',
        minLength: 8,
        maxLength: 100
      }
    });

    if (!validation.isValid) {
      logValidationError('/api/user/register', validation.errors, body);
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: validation.errors },
        { status: 400 }
      );
    }

    const { name, email, password } = validation.sanitized as { name: string; email: string; password: string };
    
    // Valider passord med ekstra regler
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Password does not meet requirements', errors: passwordValidation.errors },
        { status: 400 }
      );
    }
    
    // Sjekk om brukeren allerede eksisterer
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    // Hash passordet med bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generer verifikasjonstoken
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 timer
    
    // Opprett brukeren
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      emailVerified: false,
      verificationToken,
      verificationTokenExpires
    });
    
    console.log('User created:', {
      email: user.email,
      emailVerified: user.emailVerified,
      hasToken: !!user.verificationToken,
      tokenExpires: user.verificationTokenExpires
    });
    
    // Send verifikasjonse-post
    try {
      await sendVerificationEmail(user.email, verificationToken);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Vi fortsetter selv om e-posten feiler - brukeren kan be om ny verifikasjonse-post senere
    }
    
    // Returner bruker uten passord
    const userWithoutPassword = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified
    };
    
    return NextResponse.json({ 
      success: true, 
      data: userWithoutPassword,
      message: 'Registration successful! Please check your email to verify your account.'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error registering user:', error);
    Sentry.captureException(error, {
      tags: { api: 'register' },
      extra: { errorMessage: error.message }
    });
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}