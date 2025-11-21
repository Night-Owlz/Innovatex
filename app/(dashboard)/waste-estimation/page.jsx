'use client';

import { useState, useEffect } from 'react';
import {
    TrendingDown,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Leaf,
    DollarSign,
    BarChart3,
    Users,
    ArrowRight
} from 'lucide-react';
import api from '@/lib/api';

export default function WasteEstimationPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [usingMockData, setUsingMockData] = useState(false);

    // Mock data provided by user
    const MOCK_DATA = {
        "success": true,
        "message": "Waste estimation completed successfully",
        "data": {
            "weeklyWasteGrams": 4666.666666666666,
            "weeklyWasteCost": 0.0,
            "monthlyWasteGrams": 20000.0,
            "monthlyWasteCost": 0.0,
            "projectedYearlyGrams": 240000.0,
            "projectedYearlyCost": 0.0,
            "predictionDate": "2025-11-21",
            "comparison": {
                "user_location": "Dhaka Cantonment",
                "community_average": {
                    "weekly_grams": 400,
                    "weekly_cost": 600
                },
                "comparison_status": "worse",
                "difference_grams": 4266.666666666666,
                "difference_cost": -600.0
            },
            "dateRange": {
                "start": null,
                "end": null
            }
        }
    };

    useEffect(() => {
        fetchEstimation();
    }, []);

    const transformData = (apiData) => {
        // Check if data matches the mock structure (flat properties) or the original controller structure (nested objects)
        if (apiData.weeklyWasteGrams !== undefined) {
            // Transform mock/flat structure to component expected structure
            return {
                currentWeekWaste: {
                    grams: apiData.weeklyWasteGrams,
                    cost: apiData.weeklyWasteCost
                },
                currentMonthWaste: {
                    grams: apiData.monthlyWasteGrams,
                    cost: apiData.monthlyWasteCost
                },
                projectedYearlyWaste: {
                    grams: apiData.projectedYearlyGrams,
                    cost: apiData.projectedYearlyCost,
                    daysOfData: 30 // Default for mock
                },
                comparison: {
                    status: apiData.comparison.comparison_status === 'worse' ? 'needs-improvement' : 'good',
                    message: apiData.comparison.comparison_status === 'worse'
                        ? "You're wasting more than average. Let's work on reducing waste together."
                        : "Great job! You are below the community average.",
                    percentageOfAverage: (apiData.projectedYearlyGrams / (apiData.comparison.community_average.weekly_grams * 52)) * 100, // Approx calc
                    savingsVsAverage: {
                        grams: -apiData.comparison.difference_grams,
                        cost: -apiData.comparison.difference_cost
                    }
                },
                recommendations: [
                    "Use the meal planner to plan ahead and reduce waste.",
                    "Set up expiration alerts to use items before they spoil.",
                    "Store food properly to extend shelf life.",
                    "Consider freezing items that are about to expire."
                ]
            };
        }

        // Return as is if it matches original structure
        return apiData;
    };

    const fetchEstimation = async () => {
        try {
            setLoading(true);
            const response = await api.getWasteEstimation();
            setData(transformData(response.data || response));
            setLoading(false);
        } catch (err) {
            console.warn('Failed to fetch waste estimation, using mock data:', err);
            // Fallback to mock data
            setData(transformData(MOCK_DATA.data));
            setUsingMockData(true);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                    <strong className="font-bold">Error: </strong>
                    <span className="block sm:inline">{error}</span>
                    <button
                        onClick={fetchEstimation}
                        className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 font-semibold py-1 px-3 rounded text-sm transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const {
        currentWeekWaste,
        currentMonthWaste,
        projectedYearlyWaste,
        comparison,
        recommendations
    } = data;

    // Helper for currency formatting
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Helper for weight formatting
    const formatWeight = (grams) => {
        if (grams >= 1000) {
            return `${(grams / 1000).toFixed(1)} kg`;
        }
        return `${Math.round(grams)} g`;
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Leaf className="h-8 w-8 text-emerald-500" />
                        AI Waste Estimation
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Analyze your food waste patterns and see how you compare to the community.
                    </p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <span className="text-sm text-emerald-800 dark:text-emerald-200 font-medium">
                        Prediction Date: {new Date().toLocaleDateString()}
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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Weekly Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">This Week</h3>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-blue-600 dark:text-blue-400">
                            <BarChart3 className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatWeight(currentWeekWaste.grams)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">wasted</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-300">Estimated Cost</span>
                            <span className="font-medium text-red-500">{formatCurrency(currentWeekWaste.cost)}</span>
                        </div>
                    </div>
                </div>

                {/* Monthly Card */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">This Month</h3>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatWeight(currentMonthWaste.grams)}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400 mb-1">wasted</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-300">Estimated Cost</span>
                            <span className="font-medium text-red-500">{formatCurrency(currentMonthWaste.cost)}</span>
                        </div>
                    </div>
                </div>

                {/* Yearly Projection Card */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-xl shadow-lg p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle className="h-24 w-24" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-200">Yearly Projection</h3>
                            <div className="p-2 bg-white/10 rounded-full text-white">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <span className="text-3xl font-bold text-white">
                                    {formatWeight(projectedYearlyWaste.grams)}
                                </span>
                                <span className="text-sm text-gray-300 mb-1">projected</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                                <span className="text-gray-300">Potential Loss</span>
                                <span className="font-bold text-red-300">{formatCurrency(projectedYearlyWaste.cost)}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Based on your current waste patterns ({projectedYearlyWaste.daysOfData} days of data)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comparison Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Visual Comparison Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Users className="h-6 w-6 text-indigo-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Community Comparison</h2>
                    </div>

                    <div className="space-y-8">
                        {/* Status Badge */}
                        <div className={`p-4 rounded-lg border flex items-start gap-3 ${comparison.status === 'excellent' || comparison.status === 'good'
                            ? 'bg-green-50 border-green-100 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                            : comparison.status === 'average'
                                ? 'bg-yellow-50 border-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
                                : 'bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                            }`}>
                            {comparison.status === 'excellent' || comparison.status === 'good' ? (
                                <CheckCircle className="h-6 w-6 shrink-0" />
                            ) : comparison.status === 'average' ? (
                                <TrendingUp className="h-6 w-6 shrink-0" />
                            ) : (
                                <TrendingDown className="h-6 w-6 shrink-0" />
                            )}
                            <div>
                                <h4 className="font-semibold capitalize">{comparison.status.replace('-', ' ')}</h4>
                                <p className="text-sm mt-1 opacity-90">{comparison.message}</p>
                            </div>
                        </div>

                        {/* Bar Chart */}
                        <div className="space-y-6">
                            {/* User Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">You</span>
                                    <span className="text-gray-500">{formatCurrency(projectedYearlyWaste.cost)}/yr</span>
                                </div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${comparison.percentageOfAverage <= 100 ? 'bg-emerald-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${Math.min(comparison.percentageOfAverage, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Community Bar */}
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Community Average</span>
                                    <span className="text-gray-500">$1,200.00/yr</span>
                                </div>
                                <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                    <div className="h-full w-full bg-gray-400 dark:bg-gray-600 rounded-full"></div>
                                    {/* Marker for user position if exceeding average */}
                                    {comparison.percentageOfAverage > 100 && (
                                        <div
                                            className="absolute top-0 bottom-0 w-1 bg-red-500 z-10"
                                            style={{ left: '100%' }}
                                        ></div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Savings/Loss Stat */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-gray-600 dark:text-gray-400">Difference vs Average</span>
                            <span className={`font-bold text-lg ${comparison.savingsVsAverage.cost >= 0 ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                {comparison.savingsVsAverage.cost >= 0 ? '-' : '+'}{formatCurrency(Math.abs(comparison.savingsVsAverage.cost))}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center gap-2 mb-6">
                        <Leaf className="h-6 w-6 text-emerald-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Recommendations</h2>
                    </div>

                    <div className="space-y-4">
                        {recommendations.map((rec, index) => (
                            <div key={index} className="flex gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 transition-all hover:shadow-md">
                                <div className="bg-white dark:bg-gray-800 p-2 rounded-full h-fit shadow-sm text-emerald-600 dark:text-emerald-400">
                                    <ArrowRight className="h-4 w-4" />
                                </div>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {rec}
                                </p>
                            </div>
                        ))}

                        {recommendations.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                                No recommendations available at this time.
                            </div>
                        )}
                    </div>

                    <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Did you know?
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            Reducing food waste by just 20% could save you over $240 per year and significantly reduce your carbon footprint.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
