<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsumptionLog;
use App\Models\ConsumptionPattern;
use App\Models\Inventory;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AIAnalysisController extends Controller
{
    /**
     * Analyze user's consumption patterns and waste risks
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function analyzePatterns(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Fetch consumption logs from last 30 days
            $thirtyDaysAgo = Carbon::now()->subDays(30);
            $consumptionLogs = ConsumptionLog::where('user_id', $user->id)
                ->where('consumption_date', '>=', $thirtyDaysAgo)
                ->get();

            if ($consumptionLogs->isEmpty()) {
                return response()->json([
                    'message' => 'No consumption data available for analysis',
                    'weeklyTrends' => [],
                    'overConsumption' => [],
                    'underConsumption' => [],
                    'wasteRiskItems' => [],
                    'imbalancedPatterns' => [],
                ], 200);
            }

            // Calculate weekly trends (heatmap data)
            $weeklyTrends = $this->calculateWeeklyTrends($consumptionLogs);

            // Calculate average consumption per category
            $categoryAverages = $this->calculateCategoryAverages($consumptionLogs);

            // Detect over-consumption
            $overConsumption = $this->detectOverConsumption($consumptionLogs, $categoryAverages);

            // Detect under-consumption
            $underConsumption = $this->detectUnderConsumption($user->id);

            // Calculate waste risk for inventory items
            $wasteRiskItems = $this->calculateWasteRisk($user->id, $consumptionLogs);

            // Identify imbalanced patterns
            $imbalancedPatterns = $this->identifyImbalancedPatterns($categoryAverages, $weeklyTrends);

            // Save analysis to consumption_patterns table
            $pattern = ConsumptionPattern::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'analysis_date' => Carbon::today(),
                ],
                [
                    'weekly_trends' => $weeklyTrends,
                    'over_consumption' => $overConsumption,
                    'under_consumption' => $underConsumption,
                    'waste_risk_items' => $wasteRiskItems,
                ]
            );

            return response()->json([
                'message' => 'Analysis completed successfully',
                'weeklyTrends' => $weeklyTrends,
                'overConsumption' => $overConsumption,
                'underConsumption' => $underConsumption,
                'wasteRiskItems' => $wasteRiskItems,
                'imbalancedPatterns' => $imbalancedPatterns,
                'analysisDate' => $pattern->analysis_date->toDateString(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('AI Analysis Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to analyze consumption patterns',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred during analysis',
            ], 500);
        }
    }

    /**
     * Calculate weekly trends as heatmap data
     *
     * @param \Illuminate\Support\Collection $logs
     * @return array
     */
    private function calculateWeeklyTrends($logs): array
    {
        $daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $weeklyTrends = [];

        // Initialize structure
        foreach ($daysOfWeek as $day) {
            $weeklyTrends[$day] = [];
        }

        // Group logs by day of week and category
        $grouped = $logs->groupBy(function ($log) {
            return Carbon::parse($log->consumption_date)->format('l'); // Day name
        });

        foreach ($grouped as $dayName => $dayLogs) {
            $categoryTotals = $dayLogs->groupBy('category')->map(function ($categoryLogs) {
                return round($categoryLogs->sum('quantity'), 2);
            });

            $weeklyTrends[$dayName] = $categoryTotals->toArray();
        }

        return $weeklyTrends;
    }

    /**
     * Calculate average consumption per category
     *
     * @param \Illuminate\Support\Collection $logs
     * @return array
     */
    private function calculateCategoryAverages($logs): array
    {
        $weeksOfData = 4; // 30 days ≈ 4 weeks
        
        $categoryTotals = $logs->groupBy('category')->map(function ($categoryLogs) use ($weeksOfData) {
            $total = $categoryLogs->sum('quantity');
            $weeklyAverage = round($total / $weeksOfData, 2);
            
            return [
                'total' => $total,
                'weekly_average' => $weeklyAverage,
                'count' => $categoryLogs->count(),
            ];
        });

        return $categoryTotals->toArray();
    }

    /**
     * Detect over-consumption (current weekly average > 2x normal)
     *
     * @param \Illuminate\Support\Collection $logs
     * @param array $categoryAverages
     * @return array
     */
    private function detectOverConsumption($logs, array $categoryAverages): array
    {
        $overConsumption = [];
        $currentWeekStart = Carbon::now()->startOfWeek();

        // Get current week's consumption
        $currentWeekLogs = $logs->filter(function ($log) use ($currentWeekStart) {
            return Carbon::parse($log->consumption_date)->greaterThanOrEqualTo($currentWeekStart);
        });

        $currentWeekTotals = $currentWeekLogs->groupBy('category')->map(function ($categoryLogs) {
            return $categoryLogs->sum('quantity');
        });

        foreach ($currentWeekTotals as $category => $currentTotal) {
            if (isset($categoryAverages[$category])) {
                $normalAverage = $categoryAverages[$category]['weekly_average'];
                
                // Check if current consumption > 2x normal average
                if ($currentTotal > ($normalAverage * 2) && $normalAverage > 0) {
                    $overConsumption[] = [
                        'category' => $category,
                        'current_week_total' => round($currentTotal, 2),
                        'normal_weekly_average' => $normalAverage,
                        'excess_percentage' => round((($currentTotal - $normalAverage) / $normalAverage) * 100, 1),
                        'recommendation' => "You've consumed {$currentTotal} units of {$category} this week, which is " . 
                                          round($currentTotal / $normalAverage, 1) . "x your normal weekly average.",
                    ];
                }
            }
        }

        return $overConsumption;
    }

    /**
     * Detect under-consumption (categories not logged in last 14 days)
     *
     * @param int $userId
     * @return array
     */
    private function detectUnderConsumption(int $userId): array
    {
        $underConsumption = [];
        $requiredCategories = ['fruit', 'vegetable', 'dairy', 'grain', 'protein'];
        $fourteenDaysAgo = Carbon::now()->subDays(14);

        // Get categories consumed in last 14 days
        $recentCategories = ConsumptionLog::where('user_id', $userId)
            ->where('consumption_date', '>=', $fourteenDaysAgo)
            ->pluck('category')
            ->unique()
            ->map(function ($category) {
                return strtolower(trim($category));
            })
            ->toArray();

        foreach ($requiredCategories as $category) {
            if (!in_array($category, $recentCategories)) {
                // Check last consumption date for this category
                $lastLog = ConsumptionLog::where('user_id', $userId)
                    ->whereRaw('LOWER(category) = ?', [strtolower($category)])
                    ->orderBy('consumption_date', 'desc')
                    ->first();

                $underConsumption[] = [
                    'category' => $category,
                    'days_since_last_consumption' => $lastLog 
                        ? Carbon::parse($lastLog->consumption_date)->diffInDays(Carbon::now())
                        : null,
                    'last_consumption_date' => $lastLog ? $lastLog->consumption_date->toDateString() : null,
                    'recommendation' => "No {$category} consumption in the last 14 days. Consider adding {$category} to your diet for balanced nutrition.",
                ];
            }
        }

        return $underConsumption;
    }

    /**
     * Calculate waste risk for inventory items
     *
     * @param int $userId
     * @param \Illuminate\Support\Collection $consumptionLogs
     * @return array
     */
    private function calculateWasteRisk(int $userId, $consumptionLogs): array
    {
        $wasteRiskItems = [];
        $inventoryItems = Inventory::where('user_id', $userId)->get();

        foreach ($inventoryItems as $item) {
            $riskScore = 0;
            $riskFactors = [];

            // Factor 1: Days until expiry
            if ($item->expiration_date) {
                $daysUntilExpiry = Carbon::now()->diffInDays($item->expiration_date, false);
                
                if ($daysUntilExpiry < 0) {
                    $riskScore += 100; // Already expired
                    $riskFactors[] = 'Item has expired';
                } elseif ($daysUntilExpiry <= 3) {
                    $riskScore += 50;
                    $riskFactors[] = 'Expires in 3 days or less';
                } elseif ($daysUntilExpiry <= 7) {
                    $riskScore += 30;
                    $riskFactors[] = 'Expires within a week';
                } elseif ($daysUntilExpiry <= 14) {
                    $riskScore += 15;
                    $riskFactors[] = 'Expires within 2 weeks';
                }
            }

            // Factor 2: Consumption frequency for this category
            $categoryConsumption = $consumptionLogs->where('category', $item->category);
            $consumptionFrequency = $categoryConsumption->count();
            
            if ($consumptionFrequency == 0) {
                $riskScore += 30;
                $riskFactors[] = 'Category never consumed in last 30 days';
            } elseif ($consumptionFrequency <= 2) {
                $riskScore += 20;
                $riskFactors[] = 'Low consumption frequency';
            }

            // Factor 3: Large quantity
            if ($item->quantity > 5) {
                $riskScore += 15;
                $riskFactors[] = 'Large quantity in stock';
            } elseif ($item->quantity > 10) {
                $riskScore += 25;
                $riskFactors[] = 'Very large quantity in stock';
            }

            // Factor 4: Item-specific consumption rate
            $itemConsumption = $consumptionLogs->where('item_name', $item->item_name);
            if ($itemConsumption->isEmpty() && $item->expiration_date && 
                Carbon::now()->diffInDays($item->expiration_date, false) <= 14) {
                $riskScore += 20;
                $riskFactors[] = 'Specific item not consumed recently';
            }

            // Only include items with risk score > 50
            if ($riskScore > 50) {
                $wasteRiskItems[] = [
                    'item_name' => $item->item_name,
                    'category' => $item->category,
                    'quantity' => $item->quantity,
                    'unit' => $item->unit,
                    'expiration_date' => $item->expiration_date ? $item->expiration_date->toDateString() : null,
                    'days_until_expiry' => $item->expiration_date 
                        ? Carbon::now()->diffInDays($item->expiration_date, false) 
                        : null,
                    'risk_score' => min($riskScore, 100), // Cap at 100
                    'risk_level' => $this->getRiskLevel($riskScore),
                    'risk_factors' => $riskFactors,
                    'recommendation' => $this->getWasteRecommendation($item, $riskScore),
                ];
            }
        }

        // Sort by risk score descending
        usort($wasteRiskItems, function ($a, $b) {
            return $b['risk_score'] - $a['risk_score'];
        });

        return $wasteRiskItems;
    }

    /**
     * Get risk level label based on score
     *
     * @param int $score
     * @return string
     */
    private function getRiskLevel(int $score): string
    {
        if ($score >= 80) return 'critical';
        if ($score >= 60) return 'high';
        if ($score >= 40) return 'medium';
        return 'low';
    }

    /**
     * Get waste prevention recommendation
     *
     * @param Inventory $item
     * @param int $riskScore
     * @return string
     */
    private function getWasteRecommendation($item, int $riskScore): string
    {
        if ($riskScore >= 80) {
            return "Urgent: Use {$item->item_name} immediately or freeze to prevent waste.";
        } elseif ($riskScore >= 60) {
            return "High priority: Plan to use {$item->item_name} in the next 2-3 days.";
        } else {
            return "Consider using {$item->item_name} soon to avoid waste.";
        }
    }

    /**
     * Identify imbalanced consumption patterns
     *
     * @param array $categoryAverages
     * @param array $weeklyTrends
     * @return array
     */
    private function identifyImbalancedPatterns(array $categoryAverages, array $weeklyTrends): array
    {
        $imbalances = [];
        
        // Check for weekend vs weekday imbalance
        $weekdayCategories = [];
        $weekendCategories = [];
        
        foreach ($weeklyTrends as $day => $categories) {
            if (in_array($day, ['Saturday', 'Sunday'])) {
                foreach ($categories as $category => $quantity) {
                    $weekendCategories[$category] = ($weekendCategories[$category] ?? 0) + $quantity;
                }
            } else {
                foreach ($categories as $category => $quantity) {
                    $weekdayCategories[$category] = ($weekdayCategories[$category] ?? 0) + $quantity;
                }
            }
        }

        foreach ($weekdayCategories as $category => $weekdayTotal) {
            $weekendTotal = $weekendCategories[$category] ?? 0;
            $weekdayAvg = $weekdayTotal / 5; // 5 weekdays
            $weekendAvg = $weekendTotal / 2; // 2 weekend days

            if ($weekdayAvg > 0 && abs($weekendAvg - $weekdayAvg) / $weekdayAvg > 0.5) {
                $imbalances[] = [
                    'type' => 'weekend_vs_weekday',
                    'category' => $category,
                    'weekday_average' => round($weekdayAvg, 2),
                    'weekend_average' => round($weekendAvg, 2),
                    'imbalance_percentage' => round(abs($weekendAvg - $weekdayAvg) / $weekdayAvg * 100, 1),
                    'note' => $weekendAvg > $weekdayAvg 
                        ? "You consume more {$category} on weekends" 
                        : "You consume more {$category} on weekdays",
                ];
            }
        }

        return $imbalances;
    }
}
