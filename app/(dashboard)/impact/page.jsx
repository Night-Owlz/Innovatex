'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Leaf,
  Target,
  ArrowRight,
  AlertTriangle,
  Activity,
  Heart,
  Recycle
} from 'lucide-react';
import api from '@/lib/api';

export default function ImpactScorePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [usingMockData, setUsingMockData] = useState(false);

  // Mock data in case API is unavailable
  const MOCK_DATA = {
    success: true,
    message: 'SDG score calculated successfully',
    data: {
      weekStartDate: '2025-11-17',
      overallSDGScore: 50.0,
      sdgBreakdown: {
        sdg2ZeroHunger: 50,
        sdg3GoodHealth: 70.0,
        sdg12ResponsibleConsumption: 50,
      },
      metrics: {
        wasteReductionPercentage: 0,
        nutritionImprovementPercentage: 0,
        carbonFootprintScore: 70.0,
      },
      weeklyInsight:
        'Your current scores for SDG 2 (Zero Hunger) and SDG 12 (Responsible Consumption and Production) indicate a moderate level of progress. Focusing on reducing food waste and making more sustainable consumption choices will be key to improvement.',
      celebrationMessage: 'Keep up the good work! Every step you take contributes to a more sustainable future.',
      actionSteps: [
        {
          title: 'Reduce Food Waste',
          description: 'Plan your meals, store food properly, and compost food scraps to minimize waste.',
          potentialImpact: '+10 points',
          sdg_target: 'SDG 12.3',
          category: 'waste',
        },
        {
          title: 'Choose Sustainable Food',
          description:
            'Prioritize purchasing food from local farmers markets or sources that practice sustainable agriculture.',
          potentialImpact: '+8 points',
          sdg_target: 'SDG 2.1',
          category: 'nutrition',
        },
        {
          title: 'Track Your Consumption',
          description:
            'Monitor your purchases and consumption habits to identify areas where you can reduce waste and improve sustainability.',
          potentialImpact: '+7 points',
          sdg_target: 'SDG 12.2',
          category: 'sustainable',
        },
      ],
      progress: {
        weekOverWeekChange: 0,
        trend: 'stable',
      },
      createdAt: '2025-11-21T11:31:30.385638+00:00',
    },
  };

  useEffect(() => {
    fetchScore();
  }, []);

  const fetchScore = async () => {
    try {
      setLoading(true);
      const response = await api.getSDGScore();
      // Some API implementations return { data: { ... } }, others return the payload directly
      setData(response.data || response);
      setLoading(false);
    } catch (err) {
      console.warn('Failed to fetch SDG score, using mock data:', err);
      setData(MOCK_DATA.data);
      setUsingMockData(true);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
          <button onClick={fetchScore} className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded text-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const {
    overallSDGScore,
    sdgBreakdown,
    metrics,
    weeklyInsight,
    celebrationMessage,
    actionSteps,
    weekStartDate,
  } = data;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="h-8 w-8 text-emerald-500" />
            SDG Impact Score
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your contribution to United Nations Sustainable Development Goals.</p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
          <span className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">Week of {new Date(weekStartDate).toLocaleDateString()}</span>
        </div>
      </div>

      {usingMockData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-bold">Note:</span> The API is currently unavailable. Showing demonstration data for visualization purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Score Card */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500" />

          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6">Overall Impact Score</h2>

          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="96" cy="96" r="88" fill="none" stroke="currentColor" strokeWidth="12" className="text-gray-100 dark:text-gray-700" />
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - overallSDGScore / 100)}
                strokeLinecap="round"
                className={getScoreColor(overallSDGScore)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${getScoreColor(overallSDGScore)}`}>{Math.round(overallSDGScore)}</span>
              <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">Points</span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 italic">"{celebrationMessage}"</p>
        </div>

        {/* SDG Breakdown & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-blue-500" />Goal Breakdown</h3>
            <div className="space-y-6">
              {/* SDG 2 */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg"><Leaf className="h-4 w-4" /></div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Zero Hunger (SDG 2)</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{sdgBreakdown.sdg2ZeroHunger}/100</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full transition-all duration-1000" style={{ width: `${sdgBreakdown.sdg2ZeroHunger}%` }} />
                </div>
              </div>

              {/* SDG 3 */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg"><Heart className="h-4 w-4" /></div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Good Health (SDG 3)</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{sdgBreakdown.sdg3GoodHealth}/100</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${sdgBreakdown.sdg3GoodHealth}%` }} />
                </div>
              </div>

              {/* SDG 12 */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Recycle className="h-4 w-4" /></div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Responsible Consumption (SDG 12)</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{sdgBreakdown.sdg12ResponsibleConsumption}/100</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 rounded-full transition-all duration-1000" style={{ width: `${sdgBreakdown.sdg12ResponsibleConsumption}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-300 font-medium uppercase">Carbon Footprint</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{metrics.carbonFootprintScore}</p>
              <p className="text-xs text-blue-500/80 mt-1">Score</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium uppercase">Waste Reduction</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{metrics.wasteReductionPercentage}%</p>
              <p className="text-xs text-emerald-500/80 mt-1">Improvement</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-300 font-medium uppercase">Nutrition</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">{metrics.nutritionImprovementPercentage}%</p>
              <p className="text-xs text-purple-500/80 mt-1">Improvement</p>
            </div>
          </div>

          {/* Insights & Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Activity className="h-32 w-32" />
              </div>
              <div className="relative z-10">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Activity className="h-5 w-5" />Weekly AI Insight</h3>
                <p className="text-indigo-100 leading-relaxed text-lg">"{weeklyInsight}"</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><TrendingUp className="h-5 w-5 text-emerald-500" />Recommended Actions</h3>
              <div className="space-y-4">
                {actionSteps.map((step, index) => (
                  <div key={index} className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">{step.potentialImpact.replace(' points', '')}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{step.title}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{step.sdg_target}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{step.description}</p>
                      <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">Potential Impact: {step.potentialImpact}<ArrowRight className="h-3 w-3" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
  if (!data) return null;

  const {
    overallSDGScore,
    sdgBreakdown,
    metrics,
    weeklyInsight,
    celebrationMessage,
    actionSteps
  } = data;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-500';
    if (score >= 60) return 'text-blue-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="h-8 w-8 text-emerald-500" />
            SDG Impact Score
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Track your contribution to United Nations Sustainable Development Goals.
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
          <span className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
            Week of {new Date(data.weekStartDate).toLocaleDateString()}
          </span>
        </div>
      </div>

      {usingMockData && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-bold">Note:</span> The API is currently unavailable. Showing demonstration data for visualization purposes.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Score Card */}
        <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500"></div>

          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-6">Overall Impact Score</h2>

          <div className="relative w-48 h-48 flex items-center justify-center mb-6">
            {/* Circular Progress Background */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-100 dark:text-gray-700"
              />
              {/* Progress Circle */}
              <circle
                cx="96"
                cy="96"
                r="88"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeDasharray={2 * Math.PI * 88}
                strokeDashoffset={2 * Math.PI * 88 * (1 - overallSDGScore / 100)}
                strokeLinecap="round"
                className={getScoreColor(overallSDGScore)}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-bold ${getScoreColor(overallSDGScore)}`}>
                {Math.round(overallSDGScore)}
              </span>
              <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">Points</span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 italic">
            "{celebrationMessage}"
          </p>
        </div>

        {/* SDG Breakdown & Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* SDG Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Goal Breakdown
            </h3>
            <div className="space-y-6">
              {/* SDG 2 */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-lg">
                      <Leaf className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Zero Hunger (SDG 2)</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{sdgBreakdown.sdg2ZeroHunger}/100</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full transition-all duration-1000"
                    style={{ width: `${sdgBreakdown.sdg2ZeroHunger}%` }}
                  ></div>
                </div>
              </div>

              {/* SDG 3 */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg">
                      <Heart className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Good Health (SDG 3)</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{sdgBreakdown.sdg3GoodHealth}/100</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                    style={{ width: `${sdgBreakdown.sdg3GoodHealth}%` }}
                  ></div>
                </div>
              </div>

              {/* SDG 12 */}
              <div>
                <div className="flex justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg">
                      <Recycle className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-700 dark:text-gray-200">Responsible Consumption (SDG 12)</span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{sdgBreakdown.sdg12ResponsibleConsumption}/100</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${sdgBreakdown.sdg12ResponsibleConsumption}%` }}
                  ></div>
>>>>>>> Stashed changes
                </div>
              </div>
            </div>
          </div>

<<<<<<< Updated upstream
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
=======
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-300 font-medium uppercase">Carbon Footprint</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">{metrics.carbonFootprintScore}</p>
              <p className="text-xs text-blue-500/80 mt-1">Score</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800">
              <p className="text-xs text-emerald-600 dark:text-emerald-300 font-medium uppercase">Waste Reduction</p>
              <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-1">{metrics.wasteReductionPercentage}%</p>
              <p className="text-xs text-emerald-500/80 mt-1">Improvement</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
              <p className="text-xs text-purple-600 dark:text-purple-300 font-medium uppercase">Nutrition</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">{metrics.nutritionImprovementPercentage}%</p>
              <p className="text-xs text-purple-500/80 mt-1">Improvement</p>
            </div>
          </div>
        </div>
      </div>

      {/* Insights & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* AI Insight */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl shadow-lg p-6 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Activity className="h-32 w-32" />
          </div>
          <div className="relative z-10">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Weekly AI Insight
            </h3>
            <p className="text-indigo-100 leading-relaxed text-lg">
              "{weeklyInsight}"
            </p>
          </div>
        </div>

        {/* Action Steps */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Recommended Actions
          </h3>
          <div className="space-y-4">
            {actionSteps.map((step, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                    {step.potentialImpact.replace(' points', '')}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{step.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                      {step.sdg_target}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                    {step.description}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Potential Impact: {step.potentialImpact}
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
>>>>>>> Stashed changes
    </div>
  );
}
