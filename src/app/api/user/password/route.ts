import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { headers } from 'next/headers';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { validatePassword } from '@/utils/passwordValidation';
import { authRateLimiter } from '@/lib/rateLimiter';
import * as Sentry from '@sentry/nextjs';

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get IP for rate limiting
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || 
               headersList.get('x-real-ip') || 
               'unknown';
    const identifier = `password-change:${session.user.email}:${ip}`;
    
    // Check rate limit (3 attempts per 15 minutes per user+IP)
    const isAllowed = await authRateLimiter.isAllowed(identifier);
    if (!isAllowed) {
      const remainingTime = authRateLimiter.getRemainingTime(identifier);
      
      Sentry.captureMessage(`Password change rate limit exceeded for user: ${session.user.email}`, {
        level: 'warning',
        tags: { security: 'rate-limit', action: 'password-change' },
        user: { email: session.user.email }
      });
      
      return NextResponse.json(
        { 
          error: 'Too many password change attempts. Please try again later.',
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
    
    const { currentPassword, newPassword } = await request.json();
    
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }
    
    // Valider nytt passord
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: 'New password does not meet requirements', errors: passwordValidation.errors },
        { status: 400 }
      );
    }
    
    await dbConnect();
    
    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 }
      );
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    return NextResponse.json(
      { success: true, message: 'Password updated successfully' },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error updating password:', error);
    return NextResponse.json(
      { error: 'Failed to update password' },
      { status: 500 }
    );
  }
}