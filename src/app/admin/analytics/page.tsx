'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock,
  MousePointer,
  ArrowUp,
  ArrowDown,
  Calendar,
  Globe,
  Smartphone,
  Monitor,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  pageViews: {
    total: number;
    today: number;
    yesterday: number;
    thisWeek: number;
    thisMonth: number;
    trend: number;
  };
  uniqueVisitors: {
    total: number;
    today: number;
    trend: number;
  };
  avgDuration: {
    overall: number;
    trend: number;
  };
  topPages: Array<{
    page: string;
    views: number;
    avgDuration: number;
    bounceRate: number;
  }>;
  topReferrers: Array<{
    referrer: string;
    visits: number;
  }>;
  devices: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  recentActivity: Array<{
    page: string;
    timestamp: string;
    duration: number;
    device: string;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/admin/analytics?timeRange=${timeRange}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Check if we have actual data
          if (result.data.pageViews.total > 0 || result.data.uniqueVisitors.total > 0) {
            setData(result.data);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const renderTrend = (trend: number) => {
    if (trend > 0) {
      return (
        <span className="flex items-center text-green-600 text-sm">
          <ArrowUp className="w-3 h-3 mr-1" />
          {trend}%
        </span>
      );
    } else if (trend < 0) {
      return (
        <span className="flex items-center text-red-600 text-sm">
          <ArrowDown className="w-3 h-3 mr-1" />
          {Math.abs(trend)}%
        </span>
      );
    }
    return <span className="text-gray-500 text-sm">0%</span>;
  };

  if (loading && !data) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  const mockData: AnalyticsData = {
    pageViews: {
      total: 12543,
      today: 234,
      yesterday: 189,
      thisWeek: 1432,
      thisMonth: 5234,
      trend: 12
    },
    uniqueVisitors: {
      total: 3421,
      today: 89,
      trend: 8
    },
    avgDuration: {
      overall: 156,
      trend: -5
    },
    topPages: [
      { page: '/', views: 3421, avgDuration: 45, bounceRate: 23 },
      { page: '/exhibitions', views: 2134, avgDuration: 123, bounceRate: 15 },
      { page: '/exhibition/modern-art-2024', views: 1832, avgDuration: 234, bounceRate: 10 },
      { page: '/about', views: 923, avgDuration: 67, bounceRate: 45 },
      { page: '/contact', views: 542, avgDuration: 89, bounceRate: 35 }
    ],
    topReferrers: [
      { referrer: 'google.com', visits: 2341 },
      { referrer: 'direct', visits: 1234 },
      { referrer: 'facebook.com', visits: 823 },
      { referrer: 'instagram.com', visits: 612 },
      { referrer: 'twitter.com', visits: 234 }
    ],
    devices: {
      desktop: 65,
      mobile: 30,
      tablet: 5
    },
    recentActivity: [
      { page: '/exhibition/contemporary-showcase', timestamp: '2 minutes ago', duration: 145, device: 'Mobile' },
      { page: '/', timestamp: '5 minutes ago', duration: 32, device: 'Desktop' },
      { page: '/exhibitions', timestamp: '8 minutes ago', duration: 89, device: 'Desktop' },
      { page: '/about', timestamp: '12 minutes ago', duration: 67, device: 'Mobile' },
      { page: '/exhibition/abstract-visions', timestamp: '15 minutes ago', duration: 234, device: 'Tablet' }
    ]
  };

  const analyticsData = data || mockData;
  const isUsingMockData = !data;

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-1">Track visitor behavior and site performance</p>
            {isUsingMockData && (
              <p className="text-sm text-amber-600 mt-2">
                Showing sample data. Real analytics will appear once visitors start using the site.
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
            <button
              onClick={fetchAnalytics}
              disabled={refreshing}
              className="p-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              {renderTrend(analyticsData.pageViews.trend)}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.pageViews.total.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Total Page Views</p>
            <p className="text-gray-500 text-xs mt-1">{analyticsData.pageViews.today} today</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              {renderTrend(analyticsData.uniqueVisitors.trend)}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.uniqueVisitors.total.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Unique Visitors</p>
            <p className="text-gray-500 text-xs mt-1">{analyticsData.uniqueVisitors.today} today</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              {renderTrend(analyticsData.avgDuration.trend)}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{formatDuration(analyticsData.avgDuration.overall)}</h3>
            <p className="text-gray-600 text-sm">Avg. Session Duration</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{analyticsData.pageViews.thisMonth.toLocaleString()}</h3>
            <p className="text-gray-600 text-sm">Views This Month</p>
            <p className="text-gray-500 text-xs mt-1">{analyticsData.pageViews.thisWeek} this week</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Pages */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Pages</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Page</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Views</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Avg. Duration</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider pb-2">Bounce Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {analyticsData.topPages.map((page, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{page.page}</span>
                        </div>
                      </td>
                      <td className="text-right text-sm text-gray-900">{page.views.toLocaleString()}</td>
                      <td className="text-right text-sm text-gray-900">{formatDuration(page.avgDuration)}</td>
                      <td className="text-right text-sm text-gray-900">{page.bounceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Device Breakdown</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Monitor className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Desktop</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">{analyticsData.devices.desktop}%</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${analyticsData.devices.desktop}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Smartphone className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Mobile</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">{analyticsData.devices.mobile}%</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${analyticsData.devices.mobile}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Monitor className="w-5 h-5 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-700">Tablet</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">{analyticsData.devices.tablet}%</span>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${analyticsData.devices.tablet}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity & Top Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {analyticsData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.page}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{activity.timestamp}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{formatDuration(activity.duration)}</span>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{activity.device}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referrers */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers</h2>
            <div className="space-y-3">
              {analyticsData.topReferrers.map((referrer, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-900">
                    {referrer.referrer === 'direct' ? 'Direct Traffic' : referrer.referrer}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{referrer.visits.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}