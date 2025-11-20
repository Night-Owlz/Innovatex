'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatDate, getExpirationBadgeClasses, formatExpirationDate } from '@/lib/utils';
import RecommendationsWidget from '@/components/common/RecommendationsWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, ClipboardList, TrendingUp, Calendar, Tag } from 'lucide-react';

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.getDashboardSummary();
        // Handle standardized API response
        setSummary(response?.data || response);
      } catch (error) {
        console.error('Error fetching dashboard summary:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSummary();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold gradient-text">
          Welcome back, {user?.full_name}!
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          {"Here's what's happening with your food management"}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="premium-card border-gray-800/50 hover:border-teal-500/30 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Total Items</CardDescription>
              <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-teal-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">
              {summary?.total_inventory_items || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">In your inventory</p>
          </CardContent>
        </Card>

        <Card className="premium-card border-gray-800/50 hover:border-orange-500/30 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Expiring Soon</CardDescription>
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-orange-400">
              {summary?.items_expiring_soon || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Require attention</p>
          </CardContent>
        </Card>

        <Card className="premium-card border-gray-800/50 hover:border-purple-500/30 transition-all duration-300">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-gray-400">Recent Logs</CardDescription>
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-white">
              {summary?.recent_logs_count || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">Last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Items */}
      {summary?.expiring_inventory && summary.expiring_inventory.length > 0 && (
        <Card className="premium-card border-gray-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <CardTitle className="text-white">Items Expiring Soon</CardTitle>
                <CardDescription>Keep track of items that need attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.expiring_inventory.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 hover:border-gray-700/50 transition-all">
                <div className="flex-1">
                  <h3 className="font-semibold text-white text-lg">{item.item_name}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Package className="w-4 h-4" />
                      <span>{item.quantity} {item.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Tag className="w-4 h-4" />
                      <span>{item.category}</span>
                    </div>
                    {item.purchase_date && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Purchased {formatDate(item.purchase_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold ${
                    item.is_expired 
                      ? 'badge-red' 
                      : item.is_expiring 
                      ? 'badge-orange' 
                      : 'badge-green'
                  }`}>
                    {formatExpirationDate(item.expiration_date)}
                  </span>
                  {item.is_expired && (
                    <p className="text-xs text-red-400 mt-2 flex items-center justify-end gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Expired
                    </p>
                  )}
                  {item.is_expiring && !item.is_expired && (
                    <p className="text-xs text-orange-400 mt-2 flex items-center justify-end gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Expiring soon
                    </p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Logs */}
      {summary?.recent_logs && summary.recent_logs.length > 0 && (
        <Card className="premium-card border-gray-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-white">Recent Consumption Logs</CardTitle>
                <CardDescription>Your latest food consumption activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recent_logs.map((log) => (
              <div key={log.id} className="flex justify-between items-center p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 hover:border-gray-700/50 transition-all">
                <div className="flex-1">
                  <h3 className="font-semibold text-white">{log.item_name}</h3>
                  <div className="flex items-center gap-4 mt-1.5">
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Package className="w-4 h-4" />
                      <span>{log.quantity} {log.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Tag className="w-4 h-4" />
                      <span>{log.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(log.consumption_date)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommended Resources */}
      {summary?.recommended_resources && summary.recommended_resources.length > 0 && (
        <Card className="premium-card border-gray-800/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-teal-400" />
              </div>
              <div>
                <CardTitle className="text-white">Recommended Resources</CardTitle>
                <CardDescription>Personalized content just for you</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.recommended_resources.map((resource) => (
              <div key={resource.id} className="p-4 rounded-xl bg-gray-900/30 border border-gray-800/50 hover:border-teal-500/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">{resource.title}</h3>
                    <p className="text-sm text-gray-400 mt-2">{resource.description}</p>
                    {resource.reason && (
                      <p className="text-xs text-teal-400 mt-3 flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {resource.reason}
                      </p>
                    )}
                  </div>
                  <span className="badge-teal px-3 py-1.5 text-xs rounded-lg font-semibold whitespace-nowrap">
                    {resource.type}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Smart Recommendations Widget */}
      {/* <RecommendationsWidget /> */}
    </div>
  );
}
