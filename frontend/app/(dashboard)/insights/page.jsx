'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, AlertTriangle, AlertCircle, Package } from 'lucide-react';
import { api } from '@/lib/api';

export default function InsightsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalysis = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const response = await api.post('/ai/analyze-patterns');
      setData(response.data);
    } catch (err) {
      console.error('Error fetching analysis:', err);
      setError(err.response?.data?.message || 'Failed to fetch consumption analysis. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-lime-500 border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Analyzing your consumption patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Insights</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={fetchAnalysis}
            className="px-6 py-3 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent">
            Consumption Insights
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-powered analysis of your food consumption patterns
          </p>
        </div>
        <button
          onClick={fetchAnalysis}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-lime-500/10 text-lime-500 rounded-lg hover:bg-lime-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Analysis'}
        </button>
      </div>

      {/* Weekly Trends */}
      {data?.weeklyTrends && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Weekly Consumption Trends</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold">Day</th>
                  <th className="text-left py-3 px-4 font-semibold">Categories</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.weeklyTrends).map(([day, categories]) => (
                  <tr key={day} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 font-medium">{day}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(categories).length > 0 ? (
                          Object.entries(categories).map(([category, quantity]) => (
                            <span
                              key={category}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20"
                            >
                              {category}: {quantity}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No data</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Over-Consumption Alerts */}
      {data?.overConsumption && data.overConsumption.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h2 className="text-xl font-semibold">Over-Consumption Alerts</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.overConsumption.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:border-orange-500/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-orange-500 capitalize">{item.category}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-500">
                    +{item.excess_percentage}%
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-muted-foreground">
                    This week: <span className="font-medium text-foreground">{item.current_week_total} units</span>
                  </p>
                  <p className="text-muted-foreground">
                    Normal: <span className="font-medium text-foreground">{item.normal_weekly_average} units</span>
                  </p>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {item.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Under-Consumption Warnings */}
      {data?.underConsumption && data.underConsumption.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <h2 className="text-xl font-semibold">Under-Consumption Warnings</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.underConsumption.map((item, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-yellow-500 capitalize">{item.category}</h3>
                  {item.days_since_last_consumption && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500">
                      {item.days_since_last_consumption}d ago
                    </span>
                  )}
                </div>
                {item.last_consumption_date && (
                  <p className="text-sm text-muted-foreground mb-2">
                    Last consumed: <span className="font-medium text-foreground">{item.last_consumption_date}</span>
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {item.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waste Risk Items */}
      {data?.wasteRiskItems && data.wasteRiskItems.length > 0 && (
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold">Waste Risk Items</h2>
          </div>
          <div className="space-y-3">
            {data.wasteRiskItems.map((item, index) => {
              const isHighRisk = item.risk_score > 70;
              const isMediumRisk = item.risk_score >= 50 && item.risk_score <= 70;

              return (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${
                    isHighRisk
                      ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                      : isMediumRisk
                      ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                      : 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{item.item_name}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            isHighRisk
                              ? 'bg-red-500 text-white'
                              : isMediumRisk
                              ? 'bg-yellow-500 text-white'
                              : 'bg-orange-500 text-white'
                          }`}
                        >
                          Risk: {item.risk_score}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                          {item.risk_level}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Quantity:</span>
                          <span className="ml-1 font-medium">{item.quantity} {item.unit}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Category:</span>
                          <span className="ml-1 font-medium capitalize">{item.category}</span>
                        </div>
                        {item.expiration_date && (
                          <div>
                            <span className="text-muted-foreground">Expires:</span>
                            <span className="ml-1 font-medium">{item.expiration_date}</span>
                          </div>
                        )}
                        {item.days_until_expiry !== null && (
                          <div>
                            <span className="text-muted-foreground">Days left:</span>
                            <span className={`ml-1 font-medium ${item.days_until_expiry < 3 ? 'text-red-500' : ''}`}>
                              {item.days_until_expiry < 0 ? 'Expired' : item.days_until_expiry}
                            </span>
                          </div>
                        )}
                      </div>
                      {item.risk_factors && item.risk_factors.length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs text-muted-foreground mb-1">Risk Factors:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.risk_factors.map((factor, idx) => (
                              <span key={idx} className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                {factor}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <p className="text-sm text-muted-foreground italic">
                        💡 {item.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {data && 
       (!data.weeklyTrends || Object.keys(data.weeklyTrends).length === 0) &&
       (!data.overConsumption || data.overConsumption.length === 0) &&
       (!data.underConsumption || data.underConsumption.length === 0) &&
       (!data.wasteRiskItems || data.wasteRiskItems.length === 0) && (
        <div className="text-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Insights Available</h3>
          <p className="text-muted-foreground mb-6">
            Start logging your consumption and managing inventory to see personalized insights.
          </p>
        </div>
      )}
    </div>
  );
}
