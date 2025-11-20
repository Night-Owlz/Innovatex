'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatDate, getExpirationBadgeClasses, formatExpirationDate } from '@/lib/utils';
import RecommendationsWidget from '@/components/common/RecommendationsWidget';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, ClipboardList, TrendingUp, Calendar, Tag, Sparkles, ArrowRight } from 'lucide-react';

// Skeleton Loading Component
const StatCardSkeleton = () => (
  <Card className="premium-card border-border/50 overflow-hidden">
    <CardHeader className="pb-3">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
        <div className="w-12 h-12 bg-muted/50 rounded-xl animate-pulse" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="h-12 w-32 bg-muted/50 rounded-lg animate-pulse mb-3" />
      <div className="h-3 w-20 bg-muted/50 rounded animate-pulse" />
    </CardContent>
  </Card>
);

const ListItemSkeleton = () => (
  <div className="p-5 rounded-2xl bg-muted/20 border border-border/30 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="flex-1 space-y-3">
        <div className="h-6 w-48 bg-muted/50 rounded" />
        <div className="flex gap-4">
          <div className="h-4 w-24 bg-muted/50 rounded" />
          <div className="h-4 w-24 bg-muted/50 rounded" />
        </div>
      </div>
      <div className="h-10 w-32 bg-muted/50 rounded-xl" />
    </div>
  </div>
);

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await api.getDashboardSummary();
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
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="space-y-3">
          <div className="h-10 w-96 bg-muted/50 rounded-lg animate-pulse" />
          <div className="h-5 w-64 bg-muted/50 rounded animate-pulse" />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="grid md:grid-cols-3 gap-6">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* List Skeletons */}
        <Card className="premium-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-muted/50 rounded-xl animate-pulse" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-muted/50 rounded animate-pulse" />
                <div className="h-4 w-64 bg-muted/50 rounded animate-pulse" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header - Clean & Minimal */}
      <div className="relative">
        <div className="absolute -top-20 -left-20 w-72 h-72 bg-lime-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6 text-lime-400 dark:text-lime-400 light:text-lime-500" />
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Welcome back, {user?.full_name}
            </h1>
          </div>
          <p className="text-muted-foreground text-sm ml-9">
            Here's what's happening with your food management
          </p>
        </div>
      </div>

      {/* Stats Grid - Enhanced */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Total Items Card */}
        <Card className="group premium-card border-border/50 hover:border-lime-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-lime-500/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-lime-500/0 via-lime-500/0 to-lime-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-normal text-xs uppercase tracking-wide">
                Total Items
              </CardDescription>
              <div className="w-12 h-12 bg-gradient-to-br from-lime-500/20 to-lime-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Package className="w-5 h-5 text-lime-400 dark:text-lime-400 light:text-lime-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-5xl font-semibold text-foreground mb-2 tabular-nums group-hover:text-lime-400 dark:group-hover:text-lime-400 light:group-hover:text-lime-500 transition-colors duration-300">
              {summary?.total_inventory_items || 0}
            </p>
            <p className="text-xs text-muted-foreground/70 font-normal flex items-center gap-2">
              In your inventory
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </p>
          </CardContent>
        </Card>

        {/* Expiring Soon Card */}
        <Card className="group premium-card border-border/50 hover:border-orange-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-normal text-xs uppercase tracking-wide">
                Expiring Soon
              </CardDescription>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="w-5 h-5 text-orange-400 dark:text-orange-400 light:text-orange-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-5xl font-semibold text-orange-400 dark:text-orange-400 light:text-orange-500 mb-2 tabular-nums group-hover:scale-105 transition-transform duration-300 inline-block">
              {summary?.items_expiring_soon || 0}
            </p>
            <p className="text-xs text-muted-foreground/70 font-normal flex items-center gap-2">
              Require attention
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </p>
          </CardContent>
        </Card>

        {/* Recent Logs Card */}
        <Card className="group premium-card border-border/50 hover:border-purple-500/40 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <CardHeader className="pb-3 relative z-10">
            <div className="flex items-center justify-between">
              <CardDescription className="text-muted-foreground font-normal text-xs uppercase tracking-wide">
                Recent Logs
              </CardDescription>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="w-5 h-5 text-purple-400 dark:text-purple-400 light:text-purple-500 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-5xl font-semibold text-foreground mb-2 tabular-nums group-hover:text-purple-400 dark:group-hover:text-purple-400 light:group-hover:text-purple-500 transition-colors duration-300">
              {summary?.recent_logs_count || 0}
            </p>
            <p className="text-xs text-muted-foreground/70 font-normal flex items-center gap-2">
              Last 7 days
              <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300" />
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Items - Clean */}
      {summary?.expiring_inventory && summary.expiring_inventory.length > 0 && (
        <Card className="premium-card border-border/50 hover:border-orange-500/30 transition-all duration-300 overflow-hidden">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-orange-400 dark:text-orange-400 light:text-orange-500" />
              </div>
              <div>
                <CardTitle className="text-foreground text-xl font-semibold">Items Expiring Soon</CardTitle>
                <CardDescription className="text-sm font-normal text-muted-foreground/80">Keep track of items that need attention</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.expiring_inventory.map((item, index) => (
              <div 
                key={item.id} 
                className="group flex justify-between items-center p-4 rounded-xl bg-muted/10 border border-border/20 hover:border-orange-500/40 hover:bg-muted/20 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-base mb-2 group-hover:text-orange-400 dark:group-hover:text-orange-400 light:group-hover:text-orange-500 transition-colors duration-200">
                    {item.item_name}
                  </h3>
                  <div className="flex items-center gap-5 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                      <Package className="w-3.5 h-3.5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                      <span>{item.quantity} {item.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                      <Tag className="w-3.5 h-3.5 text-purple-400 dark:text-purple-400 light:text-purple-500" />
                      <span className="capitalize">{item.category}</span>
                    </div>
                    {item.purchase_date && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 font-normal">
                        <Calendar className="w-3 h-3" />
                        <span>Purchased {formatDate(item.purchase_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-6">
                  <span className={`inline-block px-4 py-2 rounded-lg text-xs font-medium ${
                    item.is_expired 
                      ? 'badge-red' 
                      : item.is_expiring 
                      ? 'badge-orange' 
                      : 'badge-green'
                  }`}>
                    {formatExpirationDate(item.expiration_date)}
                  </span>
                  {item.is_expired && (
                    <p className="text-xs text-red-400 dark:text-red-400 light:text-red-500 mt-1.5 flex items-center justify-end gap-1.5 font-normal">
                      <AlertTriangle className="w-3 h-3" />
                      Expired
                    </p>
                  )}
                  {item.is_expiring && !item.is_expired && (
                    <p className="text-xs text-orange-400 dark:text-orange-400 light:text-orange-500 mt-1.5 flex items-center justify-end gap-1.5 font-normal">
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

      {/* Recent Logs - Clean */}
      {summary?.recent_logs && summary.recent_logs.length > 0 && (
        <Card className="premium-card border-border/50 hover:border-purple-500/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-purple-400 dark:text-purple-400 light:text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-foreground text-xl font-semibold">Recent Consumption Logs</CardTitle>
                <CardDescription className="text-sm font-normal text-muted-foreground/80">Your latest food consumption activity</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.recent_logs.map((log, index) => (
              <div 
                key={log.id} 
                className="group flex justify-between items-center p-4 rounded-xl bg-muted/10 border border-border/20 hover:border-purple-500/40 hover:bg-muted/20 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-base mb-2 group-hover:text-purple-400 dark:group-hover:text-purple-400 light:group-hover:text-purple-500 transition-colors duration-200">
                    {log.item_name}
                  </h3>
                  <div className="flex items-center gap-5 mt-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                      <Package className="w-3.5 h-3.5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                      <span>{log.quantity} {log.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-normal">
                      <Tag className="w-3.5 h-3.5 text-purple-400 dark:text-purple-400 light:text-purple-500" />
                      <span className="capitalize">{log.category}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal bg-muted/30 px-3 py-1.5 rounded-lg">
                  <Calendar className="w-3.5 h-3.5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
                  <span>{formatDate(log.consumption_date)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recommended Resources - Clean */}
      {summary?.recommended_resources && summary.recommended_resources.length > 0 && (
        <Card className="premium-card border-border/50 hover:border-lime-500/30 transition-all duration-300">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-gradient-to-br from-lime-500/20 to-lime-600/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-lime-400 dark:text-lime-400 light:text-lime-500" />
              </div>
              <div>
                <CardTitle className="text-foreground text-xl font-semibold">Recommended Resources</CardTitle>
                <CardDescription className="text-sm font-normal text-muted-foreground/80">Personalized content just for you</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary.recommended_resources.map((resource, index) => (
              <div 
                key={resource.id} 
                className="group p-4 rounded-xl bg-muted/10 border border-border/20 hover:border-lime-500/40 hover:bg-muted/20 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-base mb-2 group-hover:text-lime-400 dark:group-hover:text-lime-400 light:group-hover:text-lime-500 transition-colors duration-200">
                      {resource.title}
                    </h3>
                    <p className="text-sm text-muted-foreground/80 font-normal leading-relaxed">
                      {resource.description}
                    </p>
                    {resource.reason && (
                      <p className="text-xs text-lime-400 dark:text-lime-400 light:text-lime-500 mt-2.5 flex items-center gap-1.5 font-normal">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {resource.reason}
                      </p>
                    )}
                  </div>
                  <span className="badge-lime px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap uppercase tracking-wide">
                    {resource.type}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
