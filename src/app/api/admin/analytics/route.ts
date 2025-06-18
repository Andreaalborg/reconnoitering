import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import { PageView, Event, DailyStats } from '@/models/Analytics';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const searchParams = req.nextUrl.searchParams;
    const timeRange = searchParams.get('timeRange') || 'week';

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case 'day':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Get page views
    const pageViews = await PageView.find({ 
      createdAt: { $gte: startDate } 
    }).sort({ createdAt: -1 });

    // Calculate statistics
    const totalPageViews = pageViews.length;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayViews = pageViews.filter(pv => pv.createdAt >= today).length;
    const yesterdayViews = pageViews.filter(pv => 
      pv.createdAt >= yesterday && pv.createdAt < today
    ).length;

    // Calculate unique visitors
    const uniqueSessions = new Set(pageViews.map(pv => pv.sessionId));
    const uniqueVisitorsTotal = uniqueSessions.size;
    
    const todayPageViews = pageViews.filter(pv => pv.createdAt >= today);
    const todayUniqueSessions = new Set(todayPageViews.map(pv => pv.sessionId));
    const uniqueVisitorsToday = todayUniqueSessions.size;

    // Calculate average duration
    const totalDuration = pageViews.reduce((sum, pv) => sum + (pv.duration || 0), 0);
    const avgDuration = pageViews.length > 0 ? Math.round(totalDuration / pageViews.length) : 0;

    // Get top pages
    const pageCounts: { [key: string]: { views: number; duration: number; sessions: Set<string> } } = {};
    pageViews.forEach(pv => {
      if (!pageCounts[pv.page]) {
        pageCounts[pv.page] = { views: 0, duration: 0, sessions: new Set() };
      }
      pageCounts[pv.page].views++;
      pageCounts[pv.page].duration += pv.duration || 0;
      pageCounts[pv.page].sessions.add(pv.sessionId);
    });

    const topPages = Object.entries(pageCounts)
      .map(([page, data]) => ({
        page,
        views: data.views,
        avgDuration: Math.round(data.duration / data.views),
        bounceRate: Math.round((data.sessions.size / data.views) * 100)
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    // Get top referrers
    const referrerCounts: { [key: string]: number } = {};
    pageViews.forEach(pv => {
      const referrer = pv.referrer || 'direct';
      let domain = 'direct';
      if (referrer !== 'direct' && referrer) {
        try {
          domain = new URL(referrer).hostname;
        } catch (e) {
          domain = referrer; // Use raw referrer if URL parsing fails
        }
      }
      referrerCounts[domain] = (referrerCounts[domain] || 0) + 1;
    });

    const topReferrers = Object.entries(referrerCounts)
      .map(([referrer, visits]) => ({ referrer, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    // Device breakdown (parse user agent)
    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0 };
    pageViews.forEach(pv => {
      const ua = pv.userAgent?.toLowerCase() || '';
      if (ua.includes('mobile')) {
        deviceCounts.mobile++;
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceCounts.tablet++;
      } else {
        deviceCounts.desktop++;
      }
    });

    const total = pageViews.length || 1;
    const devices = {
      desktop: Math.round((deviceCounts.desktop / total) * 100),
      mobile: Math.round((deviceCounts.mobile / total) * 100),
      tablet: Math.round((deviceCounts.tablet / total) * 100)
    };

    // Recent activity
    const recentActivity = pageViews
      .slice(0, 5)
      .map(pv => {
        const ua = pv.userAgent?.toLowerCase() || '';
        let device = 'Desktop';
        if (ua.includes('mobile')) device = 'Mobile';
        else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

        const minutesAgo = Math.round((Date.now() - pv.createdAt.getTime()) / 60000);
        let timestamp = `${minutesAgo} minutes ago`;
        if (minutesAgo < 1) timestamp = 'Just now';
        else if (minutesAgo === 1) timestamp = '1 minute ago';
        else if (minutesAgo > 60) {
          const hoursAgo = Math.round(minutesAgo / 60);
          timestamp = `${hoursAgo} hour${hoursAgo > 1 ? 's' : ''} ago`;
        }

        return {
          page: pv.page,
          timestamp,
          duration: pv.duration || 0,
          device
        };
      });

    // Calculate trends (compare with previous period)
    const prevStartDate = new Date(startDate);
    const prevEndDate = new Date(startDate);
    const timeRangeDays = Math.round((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    prevStartDate.setDate(prevStartDate.getDate() - timeRangeDays);

    const prevPageViews = await PageView.find({
      createdAt: { $gte: prevStartDate, $lt: startDate }
    });

    const prevTotal = prevPageViews.length || 1;
    const pageViewTrend = Math.round(((totalPageViews - prevTotal) / prevTotal) * 100);

    const prevUniqueSessions = new Set(prevPageViews.map(pv => pv.sessionId));
    const prevUniqueVisitors = prevUniqueSessions.size || 1;
    const uniqueVisitorsTrend = Math.round(((uniqueVisitorsTotal - prevUniqueVisitors) / prevUniqueVisitors) * 100);

    const prevTotalDuration = prevPageViews.reduce((sum, pv) => sum + (pv.duration || 0), 0);
    const prevAvgDuration = prevPageViews.length > 0 ? Math.round(prevTotalDuration / prevPageViews.length) : 1;
    const avgDurationTrend = Math.round(((avgDuration - prevAvgDuration) / prevAvgDuration) * 100);

    // Calculate week and month totals
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const thisWeekViews = pageViews.filter(pv => pv.createdAt >= weekAgo).length;
    const thisMonthViews = pageViews.filter(pv => pv.createdAt >= monthAgo).length;

    const analyticsData = {
      pageViews: {
        total: totalPageViews,
        today: todayViews,
        yesterday: yesterdayViews,
        thisWeek: thisWeekViews,
        thisMonth: thisMonthViews,
        trend: pageViewTrend
      },
      uniqueVisitors: {
        total: uniqueVisitorsTotal,
        today: uniqueVisitorsToday,
        trend: uniqueVisitorsTrend
      },
      avgDuration: {
        overall: avgDuration,
        trend: avgDurationTrend
      },
      topPages,
      topReferrers,
      devices,
      recentActivity
    };

    return NextResponse.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}