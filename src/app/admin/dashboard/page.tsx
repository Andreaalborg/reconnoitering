'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { 
  LayoutGrid, 
  FileText, 
  MapPin, 
  Tag, 
  Users, 
  Calendar,
  TrendingUp,
  Eye,
  Plus,
  Settings,
  BarChart3,
  Clock
} from 'lucide-react';

interface DashboardStats {
  exhibitions: {
    total: number;
    active: number;
    upcoming: number;
    past: number;
  };
  articles: {
    total: number;
    published: number;
    draft: number;
    views: number;
  };
  venues: {
    total: number;
  };
  artists: {
    total: number;
  };
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    exhibitions: { total: 0, active: 0, upcoming: 0, past: 0 },
    articles: { total: 0, published: 0, draft: 0, views: 0 },
    venues: { total: 0 },
    artists: { total: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch real statistics from API
      const statsResponse = await fetch('/api/admin/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        if (statsData.success) {
          setStats(statsData.data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { href: '/admin/exhibitions/new', label: 'New Exhibition', icon: Plus, color: 'bg-blue-500' },
    { href: '/admin/articles/new', label: 'New Article', icon: FileText, color: 'bg-green-500' },
    { href: '/admin/venues/new', label: 'New Venue', icon: MapPin, color: 'bg-purple-500' },
    { href: '/admin/artists/new', label: 'New Artist', icon: Users, color: 'bg-orange-500' },
  ];

  const managementCards = [
    { 
      href: '/admin/exhibitions', 
      label: 'Exhibitions', 
      icon: LayoutGrid, 
      count: stats.exhibitions.total,
      description: 'Manage all exhibitions',
      stats: `${stats.exhibitions.active} active`
    },
    { 
      href: '/admin/articles', 
      label: 'Articles', 
      icon: FileText, 
      count: stats.articles.total,
      description: 'Blog posts and content',
      stats: `${stats.articles.published} published`
    },
    { 
      href: '/admin/venues', 
      label: 'Venues', 
      icon: MapPin, 
      count: stats.venues.total,
      description: 'Museums and galleries',
      stats: 'All venues'
    },
    { 
      href: '/admin/artists', 
      label: 'Artists', 
      icon: Users, 
      count: stats.artists.total,
      description: 'Artist profiles',
      stats: 'All artists'
    },
    { 
      href: '/admin/tags', 
      label: 'Tags', 
      icon: Tag, 
      count: '-',
      description: 'Content categorization',
      stats: 'Manage tags'
    },
    { 
      href: '/admin/analytics', 
      label: 'Analytics', 
      icon: BarChart3, 
      count: '-',
      description: 'Site performance',
      stats: 'View insights'
    },
  ];

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's an overview of your content.</p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center gap-3 p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className={`p-2 rounded-lg text-white ${action.color}`}>
                  <action.icon className="w-5 h-5" />
                </div>
                <span className="font-medium text-gray-900">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Management Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementCards.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <card.icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{card.count}</p>
                    <p className="text-xs text-gray-500">{card.stats}</p>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{card.label}</h3>
                <p className="text-sm text-gray-600">{card.description}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link 
              href="/admin/analytics"
              className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">View Analytics</span>
            </Link>
            <Link 
              href="/"
              target="_blank"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Eye className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">View Site</span>
            </Link>
            <Link 
              href="/admin/update-tracker"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Clock className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">Update Tracker</span>
            </Link>
            <Link 
              href="/faq"
              target="_blank"
              className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-700">FAQ</span>
            </Link>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Status</p>
                <p className="text-xs text-green-600">All systems operational</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Article Views</p>
                <p className="text-xs text-gray-500">{stats.articles.views} total</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900">Version</p>
                <p className="text-xs text-gray-500">1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}