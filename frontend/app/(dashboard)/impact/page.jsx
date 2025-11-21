'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Target, Lightbulb, Award, Leaf, Apple, Package, Recycle } from 'lucide-react';
import { api } from '@/lib/api';

export default function ImpactPage() {
  const [impactData, setImpactData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImpactScore();
  }, []);

  const fetchImpactScore = async () => {
    try {
      setRefreshing(true);
      setError(null);
      
      const response = await api.post('/ai/impact-score');
      setImpactData(response.data);
    } catch (err) {
      console.error('Error fetching impact score:', err);
      setError(err.response?.data?.message || 'Failed to fetch impact score. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-lime-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-lime-500 to-green-500';
    if (score >= 40) return 'from-yellow-500 to-lime-500';
    return 'from-orange-500 to-yellow-500';
  };

  const getBreakdownIcon = (category) => {
    switch (category) {
      case 'wasteReduction':
        return <Recycle className="h-5 w-5 text-green-500" />;
      case 'nutritionBalance':
        return <Apple className="h-5 w-5 text-orange-500" />;
      case 'inventoryUtilization':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'sustainablePractices':
        return <Leaf className="h-5 w-5 text-lime-500" />;
      default:
        return null;
    }
  };

  const getBreakdownColor = (category) => {
    switch (category) {
      case 'wasteReduction':
        return 'bg-green-500';
      case 'nutritionBalance':
        return 'bg-orange-500';
      case 'inventoryUtilization':
        return 'bg-blue-500';
      case 'sustainablePractices':
        return 'bg-lime-500';
      default:
        return 'bg-gray-500';
    }
  };

  const breakdownLabels = {
    wasteReduction: 'Waste Reduction',
    nutritionBalance: 'Nutrition Balance',
    inventoryUtilization: 'Inventory Utilization',
    sustainablePractices: 'Sustainable Practices',
  };

  const breakdownWeights = {
    wasteReduction: 40,
    nutritionBalance: 30,
    inventoryUtilization: 20,
    sustainablePractices: 10,
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-lime-500 border-r-transparent mb-4"></div>
          <p className="text-muted-foreground">Calculating your impact score...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <Award className="h-16 w-16 text-red-500 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">Unable to Load Impact Score</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={fetchImpactScore}
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
            Impact Score
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your contribution to sustainable food management
          </p>
        </div>
        <button
          onClick={fetchImpactScore}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-lime-500/10 text-lime-500 rounded-lg hover:bg-lime-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Score'}
        </button>
      </div>

      {impactData && (
        <>
          {/* Score Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Circular Score Gauge */}
            <div className="md:col-span-1">
              <div className="bg-card border rounded-lg p-8 h-full flex flex-col items-center justify-center">
                <div className="relative w-48 h-48 mb-4">
                  {/* Outer Circle */}
                  <div className="absolute inset-0 rounded-full border-8 border-muted"></div>
                  {/* Progress Circle */}
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={`${getScoreColor(impactData.overallScore)}`}
                      strokeDasharray={`${(impactData.overallScore / 100) * 264} 264`}
                      style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                    />
                  </svg>
                  {/* Score Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-5xl font-bold ${getScoreColor(impactData.overallScore)}`}>
                      {Math.round(impactData.overallScore)}
                    </span>
                    <span className="text-sm text-muted-foreground">out of 100</span>
                  </div>
                </div>

                {/* Weekly Change Badge */}
                {impactData.weeklyChange !== undefined && impactData.weeklyChange !== 0 && (
                  <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                    impactData.weeklyChange > 0 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {impactData.weeklyChange > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span className="text-sm font-semibold">
                      {impactData.weeklyChange > 0 ? '+' : ''}{impactData.weeklyChange} points
                    </span>
                    <span className="text-xs opacity-75">from last week</span>
                  </div>
                )}

                <p className="text-center text-sm text-muted-foreground mt-4">
                  Your overall sustainability impact
                </p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="md:col-span-2">
              <div className="bg-card border rounded-lg p-6 h-full">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <Target className="h-5 w-5 text-lime-500" />
                  Score Breakdown
                </h3>
                <div className="space-y-6">
                  {impactData.breakdown && Object.entries(impactData.breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getBreakdownIcon(key)}
                          <span className="font-medium text-sm">{breakdownLabels[key]}</span>
                          <span className="text-xs text-muted-foreground">({breakdownWeights[key]}% weight)</span>
                        </div>
                        <span className="font-semibold text-sm">{Math.round(value)}/100</span>
                      </div>
                      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`absolute inset-y-0 left-0 ${getBreakdownColor(key)} rounded-full transition-all duration-1000 ease-out`}
                          style={{ width: `${value}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          {impactData.insights && (
            <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-blue-500">Insights</h3>
                  <p className="text-sm text-foreground leading-relaxed">
                    {impactData.insights}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Steps */}
          {impactData.actionSteps && impactData.actionSteps.length > 0 && (
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Award className="h-5 w-5 text-lime-500" />
                Recommended Actions to Improve Your Score
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {impactData.actionSteps.map((action, index) => (
                  <div 
                    key={index}
                    className="bg-card border hover:border-lime-500/50 rounded-lg p-5 transition-all hover:shadow-lg hover:shadow-lime-500/10 group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-semibold text-sm group-hover:text-lime-500 transition-colors">
                        {action.title}
                      </h4>
                      {action.potentialImpact && (
                        <span className="px-2 py-1 bg-gradient-to-r from-lime-500 to-emerald-500 text-white text-xs font-bold rounded-full flex-shrink-0 ml-2">
                          {action.potentialImpact}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SDG Alignment */}
          {impactData.sdgAlignment && (
            <div className="bg-gradient-to-br from-lime-500/10 to-emerald-500/10 border border-lime-500/30 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-lime-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Leaf className="h-5 w-5 text-lime-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-lime-500">UN Sustainable Development Goals</h3>
                  <p className="text-sm text-foreground mb-3">
                    Your food management practices contribute to these global goals:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {impactData.sdgAlignment.map((sdg, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1.5 bg-lime-500/20 text-lime-500 border border-lime-500/30 rounded-full text-xs font-medium"
                      >
                        {sdg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
