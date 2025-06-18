import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import { PageView, Event } from '@/models/Analytics';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    
    const body = await req.json();
    const { type, ...data } = body;
    
    // Get session if user is logged in
    const session = await getServerSession(authOptions);
    
    // Get request headers for additional info
    const headersList = headers();
    const userAgent = headersList.get('user-agent') || '';
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || '';
    
    // Generate or get session ID
    const sessionId = data.sessionId || generateSessionId();
    
    if (type === 'pageview') {
      await PageView.create({
        page: data.page,
        path: data.path,
        referrer: data.referrer || headersList.get('referer') || '',
        userAgent,
        ip,
        userId: session?.user?.id || null,
        sessionId,
        exhibitionId: data.exhibitionId || null,
        articleId: data.articleId || null
      });
    } else if (type === 'event') {
      await Event.create({
        eventType: data.eventType,
        eventName: data.eventName,
        eventValue: data.eventValue,
        page: data.page,
        userId: session?.user?.id || null,
        sessionId,
        metadata: data.metadata || {}
      });
    }
    
    return NextResponse.json({ success: true, sessionId });
  } catch (error) {
    console.error('Analytics tracking error:', error);
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
    const { sessionId, page, duration, scrollDepth, clicks } = body;
    
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
    return NextResponse.json(
      { success: false, error: 'Failed to update analytics' },
      { status: 500 }
    );
  }
}

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}