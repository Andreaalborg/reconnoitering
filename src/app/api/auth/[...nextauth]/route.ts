import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { authOptions } from '../options';
import { authRateLimiter } from '@/lib/rateLimiter';
import * as Sentry from '@sentry/nextjs';

const handler = NextAuth(authOptions);

// Wrap the NextAuth handler with rate limiting for login attempts
async function authHandler(req: NextRequest, context: any) {
  // Only apply rate limiting to credential login attempts
  if (req.method === 'POST' && req.url.includes('callback/credentials')) {
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
        
        Sentry.captureMessage(`Login rate limit exceeded for IP: ${ip}`, {
          level: 'warning',
          tags: { security: 'rate-limit', action: 'login' }
        });
        
        return NextResponse.json(
          { 
            error: 'Too many login attempts. Please try again later.',
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
    } catch (error) {
      // Log error but don't block authentication
      console.error('Rate limiting error:', error);
      Sentry.captureException(error, {
        tags: { security: 'rate-limit-error' }
      });
    }
  }
  
  // @ts-ignore - NextAuth types don't perfectly match Next.js 13+ route handlers
  return handler(req, context);
}

export { authHandler as GET, authHandler as POST };