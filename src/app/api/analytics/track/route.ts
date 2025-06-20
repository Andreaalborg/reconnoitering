import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import { PageView, Event } from '@/models/Analytics';
import { headers } from 'next/headers';
import * as Sentry from '@sentry/nextjs';
import { validateInput, logValidationError } from '@/utils/validation';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate type field
    const typeValidation = validateInput<{ type: string }>(body, {
      type: {
        required: true,
        type: 'string',
        pattern: /^(pageview|event)$/
      }
    });

    if (!typeValidation.isValid) {
      logValidationError('/api/analytics/track', typeValidation.errors, body);
      return NextResponse.json(
        { success: false, error: 'Invalid input', errors: typeValidation.errors },
        { status: 400 }
      );
    }

    const { type } = typeValidation.sanitized as { type: string };
    const { ...data } = body;
    
    // Get session if user is logged in
    const session = await getServerSession(authOptions);
    
    // Get request headers for additional info
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
    
    // Generate or get session ID
    const sessionId = data.sessionId || generateSessionId();
    
    if (type === 'pageview') {
      // Validate pageview data
      const pageviewValidation = validateInput<{ page: string; path: string; referrer?: string; sessionId?: string; exhibitionId?: string; articleId?: string }>(data, {
        page: { required: true, type: 'string', maxLength: 200, sanitize: true },
        path: { required: true, type: 'string', maxLength: 500 },
        referrer: { type: 'string', maxLength: 500 },
        sessionId: { type: 'string', maxLength: 50 },
        exhibitionId: { type: 'objectId' },
        articleId: { type: 'objectId' }
      });

      if (!pageviewValidation.isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid pageview data', errors: pageviewValidation.errors },
          { status: 400 }
        );
      }

      const validatedData = pageviewValidation.sanitized;
      await PageView.create({
        page: validatedData.page,
        path: validatedData.path,
        referrer: validatedData.referrer || headersList.get('referer') || '',
        userAgent,
        ip,
        userId: session?.user?.id || null,
        sessionId,
        exhibitionId: validatedData.exhibitionId || null,
        articleId: validatedData.articleId || null
      });
    } else if (type === 'event') {
      // Validate event data
      const eventValidation = validateInput<{ eventType: string; eventName: string; eventValue?: any; page?: string; sessionId?: string; metadata?: any }>(data, {
        eventType: { required: true, type: 'string', maxLength: 50, sanitize: true },
        eventName: { required: true, type: 'string', maxLength: 100, sanitize: true },
        page: { type: 'string', maxLength: 200, sanitize: true },
        sessionId: { type: 'string', maxLength: 50 }
      });

      if (!eventValidation.isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid event data', errors: eventValidation.errors },
          { status: 400 }
        );
      }

      const validatedEvent = eventValidation.sanitized;
      await Event.create({
        eventType: validatedEvent.eventType,
        eventName: validatedEvent.eventName,
        eventValue: data.eventValue,
        page: validatedEvent.page,
        userId: session?.user?.id || null,
        sessionId,
        metadata: data.metadata || {}
      });
    }
    
    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    Sentry.captureException(error, {
      tags: { api: 'analytics-track' }
    });
    return NextResponse.json(
      { success: false, error: 'Failed to track analytics' },
      { status: 500 }
    );
  }
}

// Update page metrics (duration, scroll depth, etc.)
export async function PUT(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    
    // Validate update data
    const validation = validateInput<{ sessionId: string; page: string; duration?: number; scrollDepth?: number; clicks?: number }>(body, {
      sessionId: { required: true, type: 'string', maxLength: 50 },
      page: { required: true, type: 'string', maxLength: 200 },
      duration: { type: 'number', min: 0, max: 86400000 }, // max 24 hours
      scrollDepth: { type: 'number', min: 0, max: 100 },
      clicks: { type: 'number', min: 0, max: 10000 }
    });

    if (!validation.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid update data', errors: validation.errors },
        { status: 400 }
      );
    }

    const { sessionId, page, duration, scrollDepth, clicks } = validation.sanitized as any;
    
    // Find the most recent pageview for this session and page
    const pageView = await PageView.findOne({ 
      sessionId, 
      page 
    }).sort({ createdAt: -1 });
    
    if (pageView) {
      if (duration !== undefined) pageView.duration = duration;
      if (scrollDepth !== undefined) pageView.scrollDepth = scrollDepth;
      if (clicks !== undefined) pageView.clicks = clicks;
      await pageView.save();
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics update error:', error);
    Sentry.captureException(error, {
      tags: { api: 'analytics-update' }
    });
    return NextResponse.json(
      { success: false, error: 'Failed to update analytics' },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}