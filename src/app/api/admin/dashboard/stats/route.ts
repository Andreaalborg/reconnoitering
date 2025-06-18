import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import dbConnect from '@/lib/mongodb';
import Exhibition from '@/models/Exhibition';
import Article from '@/models/Article';
import Venue from '@/models/Venue';
import Artist from '@/models/Artist';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Get current date
    const now = new Date();

    // Fetch exhibition stats
    const [totalExhibitions, activeExhibitions, upcomingExhibitions, pastExhibitions] = await Promise.all([
      Exhibition.countDocuments(),
      Exhibition.countDocuments({
        startDate: { $lte: now },
        endDate: { $gte: now },
        status: 'Active'
      }),
      Exhibition.countDocuments({
        startDate: { $gt: now },
        status: 'Active'
      }),
      Exhibition.countDocuments({
        endDate: { $lt: now }
      })
    ]);

    // Fetch article stats
    const [totalArticles, publishedArticles, draftArticles] = await Promise.all([
      Article.countDocuments(),
      Article.countDocuments({ status: 'published' }),
      Article.countDocuments({ status: 'draft' })
    ]);

    // Get total article views
    const articleViewsResult = await Article.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    const totalArticleViews = articleViewsResult[0]?.totalViews || 0;

    // Fetch venue and artist counts
    const [totalVenues, totalArtists] = await Promise.all([
      Venue.countDocuments(),
      Artist.countDocuments()
    ]);

    // Get recent exhibitions
    const recentExhibitions = await Exhibition.find()
      .populate('venue', 'name city country')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title venue startDate endDate status');

    // Get recent articles
    const recentArticles = await Article.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title slug status publishedAt views');

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          exhibitions: {
            total: totalExhibitions,
            active: activeExhibitions,
            upcoming: upcomingExhibitions,
            past: pastExhibitions
          },
          articles: {
            total: totalArticles,
            published: publishedArticles,
            draft: draftArticles,
            views: totalArticleViews
          },
          venues: {
            total: totalVenues
          },
          artists: {
            total: totalArtists
          }
        },
        recentExhibitions,
        recentArticles
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}