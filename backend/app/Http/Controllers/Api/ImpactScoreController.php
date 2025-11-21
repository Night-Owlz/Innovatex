<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsumptionLog;
use App\Models\ImpactScore;
use App\Models\Inventory;
use App\Models\MealPlan;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ImpactScoreController extends Controller
{
    /**
     * Community averages for comparison
     */
    private const COMMUNITY_AVERAGE_WASTE_KG = 2; // kg per week
    private const COMMUNITY_AVERAGE_WASTE_COST = 20; // $ per week

    /**
     * Calculate SDG Impact Score for user
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function calculateScore(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $today = Carbon::today();

            // Calculate each component
            $wasteReductionScore = $this->calculateWasteReductionScore($user->id);
            $nutritionBalanceScore = $this->calculateNutritionBalanceScore($user->id);
            $inventoryUtilizationScore = $this->calculateInventoryUtilizationScore($user->id);
            $sustainablePracticesScore = $this->calculateSustainablePracticesScore($user->id);

            // Calculate overall score with weighted average
            $overallScore = round(
                ($wasteReductionScore * 0.40) +
                ($nutritionBalanceScore * 0.30) +
                ($inventoryUtilizationScore * 0.20) +
                ($sustainablePracticesScore * 0.10),
                2
            );

            // Get previous week's score for comparison
            $previousScore = ImpactScore::where('user_id', $user->id)
                ->where('score_date', '<', $today)
                ->orderBy('score_date', 'desc')
                ->first();

            $weeklyChange = $previousScore 
                ? round($overallScore - $previousScore->overall_score, 2)
                : null;

            // Generate insights
            $insights = $this->generateInsights([
                'wasteReduction' => $wasteReductionScore,
                'nutritionBalance' => $nutritionBalanceScore,
                'inventoryUtilization' => $inventoryUtilizationScore,
                'sustainablePractices' => $sustainablePracticesScore,
            ], $overallScore);

            // Generate action steps based on weakest areas
            $actionSteps = $this->generateActionSteps([
                'wasteReduction' => $wasteReductionScore,
                'nutritionBalance' => $nutritionBalanceScore,
                'inventoryUtilization' => $inventoryUtilizationScore,
                'sustainablePractices' => $sustainablePracticesScore,
            ]);

            // Save to database
            $impactScore = ImpactScore::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'score_date' => $today,
                ],
                [
                    'overall_score' => $overallScore,
                    'waste_reduction_score' => $wasteReductionScore,
                    'nutrition_balance_score' => $nutritionBalanceScore,
                    'inventory_utilization_score' => $inventoryUtilizationScore,
                    'sustainable_practices_score' => $sustainablePracticesScore,
                    'insights' => $insights,
                    'action_steps' => $actionSteps,
                ]
            );

            return response()->json([
                'message' => 'Impact score calculated successfully',
                'overallScore' => $overallScore,
                'breakdown' => [
                    'wasteReduction' => $wasteReductionScore,
                    'nutritionBalance' => $nutritionBalanceScore,
                    'inventoryUtilization' => $inventoryUtilizationScore,
                    'sustainablePractices' => $sustainablePracticesScore,
                ],
                'weeklyChange' => $weeklyChange,
                'insights' => $insights,
                'actionSteps' => $actionSteps,
                'scoreDate' => $today->toDateString(),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Impact Score Calculation Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to calculate impact score',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Calculate Waste Reduction Score (40% weight)
     * Score = 100 - (user_waste / community_average * 100)
     *
     * @param int $userId
     * @return float
     */
    private function calculateWasteReductionScore(int $userId): float
    {
        $oneWeekAgo = Carbon::now()->subWeek();

        // Calculate actual waste from expired/wasted inventory
        $expiredItems = Inventory::where('user_id', $userId)
            ->where('expiration_date', '<', Carbon::now())
            ->where('expiration_date', '>=', $oneWeekAgo)
            ->get();

        $userWasteKg = $expiredItems->sum('quantity'); // Assuming quantity in kg
        $userWasteCost = $expiredItems->sum(function ($item) {
            return $item->quantity * $this->estimateItemUnitCost($item->category);
        });

        // Use cost for more accurate comparison
        $wasteRatio = $userWasteCost > 0 
            ? ($userWasteCost / self::COMMUNITY_AVERAGE_WASTE_COST)
            : 0;

        $score = 100 - ($wasteRatio * 100);

        // Cap score between 0 and 100
        return max(0, min(100, round($score, 2)));
    }

    /**
     * Calculate Nutrition Balance Score (30% weight)
     * Based on category variety in last week
     *
     * @param int $userId
     * @return float
     */
    private function calculateNutritionBalanceScore(int $userId): float
    {
        $oneWeekAgo = Carbon::now()->subWeek();

        $consumedCategories = ConsumptionLog::where('user_id', $userId)
            ->where('consumption_date', '>=', $oneWeekAgo)
            ->distinct()
            ->pluck('category')
            ->filter()
            ->map(function ($category) {
                return strtolower(trim($category));
            })
            ->unique()
            ->count();

        // 5+ categories = 100, 3-4 = 70, <3 = 40
        if ($consumedCategories >= 5) {
            return 100.00;
        } elseif ($consumedCategories >= 3) {
            return 70.00;
        } elseif ($consumedCategories > 0) {
            return 40.00;
        }

        return 0.00;
    }

    /**
     * Calculate Inventory Utilization Score (20% weight)
     * (items_consumed / items_purchased) * 100
     *
     * @param int $userId
     * @return float
     */
    private function calculateInventoryUtilizationScore(int $userId): float
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        // Count items added to inventory in last 30 days
        $itemsPurchased = Inventory::where('user_id', $userId)
            ->where('created_at', '>=', $thirtyDaysAgo)
            ->count();

        // Count consumption logs in last 30 days
        $itemsConsumed = ConsumptionLog::where('user_id', $userId)
            ->where('consumption_date', '>=', $thirtyDaysAgo)
            ->count();

        if ($itemsPurchased == 0) {
            // If no purchases, check if they're consuming from existing inventory
            return $itemsConsumed > 0 ? 100.00 : 50.00;
        }

        $utilizationRatio = $itemsConsumed / $itemsPurchased;
        $score = min(100, $utilizationRatio * 100);

        return round($score, 2);
    }

    /**
     * Calculate Sustainable Practices Score (10% weight)
     * Based on user engagement with features
     *
     * @param int $userId
     * @return float
     */
    private function calculateSustainablePracticesScore(int $userId): float
    {
        $score = 0;
        $maxScore = 100;
        $oneWeekAgo = Carbon::now()->subWeek();

        // Check if user has created meal plans (25 points)
        $hasMealPlan = MealPlan::where('user_id', $userId)
            ->where('created_at', '>=', $oneWeekAgo)
            ->exists();
        if ($hasMealPlan) {
            $score += 25;
        }

        // Check regular logging (50 points - at least 3 logs per week)
        $logCount = ConsumptionLog::where('user_id', $userId)
            ->where('consumption_date', '>=', $oneWeekAgo)
            ->count();
        if ($logCount >= 7) {
            $score += 50;
        } elseif ($logCount >= 3) {
            $score += 25;
        }

        // Check inventory management (25 points - updated recently)
        $inventoryUpdated = Inventory::where('user_id', $userId)
            ->where('updated_at', '>=', $oneWeekAgo)
            ->exists();
        if ($inventoryUpdated) {
            $score += 25;
        }

        return (float) min($maxScore, $score);
    }

    /**
     * Generate insights based on scores
     *
     * @param array $scores
     * @param float $overallScore
     * @return string
     */
    private function generateInsights(array $scores, float $overallScore): string
    {
        $insights = [];

        // Overall performance
        if ($overallScore >= 80) {
            $insights[] = "Excellent work! You're making a significant positive impact on reducing food waste and promoting sustainability.";
        } elseif ($overallScore >= 60) {
            $insights[] = "You're doing well! There's room for improvement in some areas to maximize your impact.";
        } else {
            $insights[] = "You're on the right track. Let's work together to improve your sustainability practices.";
        }

        // Waste reduction insights
        if ($scores['wasteReduction'] >= 80) {
            $insights[] = "Your waste reduction is outstanding - you're wasting significantly less than the community average!";
        } elseif ($scores['wasteReduction'] < 50) {
            $insights[] = "Focus on reducing waste by using items before they expire and planning meals better.";
        }

        // Nutrition balance insights
        if ($scores['nutritionBalance'] >= 70) {
            $insights[] = "Great job maintaining a balanced diet with variety across food categories!";
        } elseif ($scores['nutritionBalance'] < 70) {
            $insights[] = "Try to diversify your diet by consuming from more food categories each week.";
        }

        // Inventory utilization insights
        if ($scores['inventoryUtilization'] >= 80) {
            $insights[] = "Excellent inventory management - you're effectively using what you purchase!";
        } elseif ($scores['inventoryUtilization'] < 60) {
            $insights[] = "Consider consuming items from your inventory before purchasing new ones.";
        }

        return implode(' ', $insights);
    }

    /**
     * Generate action steps based on weakest areas
     *
     * @param array $scores
     * @return array
     */
    private function generateActionSteps(array $scores): array
    {
        // Sort scores to identify weakest areas
        asort($scores);
        $weakestAreas = array_slice($scores, 0, 3, true);

        $actionSteps = [];

        foreach ($weakestAreas as $area => $score) {
            switch ($area) {
                case 'wasteReduction':
                    $actionSteps[] = [
                        'area' => 'Waste Reduction',
                        'currentScore' => $score,
                        'action' => 'Check your inventory for items expiring soon and plan meals to use them before they spoil.',
                        'impact' => 'high',
                    ];
                    break;

                case 'nutritionBalance':
                    $actionSteps[] = [
                        'area' => 'Nutrition Balance',
                        'currentScore' => $score,
                        'action' => 'Add more variety to your diet by including items from different food categories (fruits, vegetables, proteins, grains, dairy).',
                        'impact' => 'medium',
                    ];
                    break;

                case 'inventoryUtilization':
                    $actionSteps[] = [
                        'area' => 'Inventory Utilization',
                        'currentScore' => $score,
                        'action' => 'Before shopping, check your inventory and create a meal plan that uses existing items first.',
                        'impact' => 'high',
                    ];
                    break;

                case 'sustainablePractices':
                    $actionSteps[] = [
                        'area' => 'Sustainable Practices',
                        'currentScore' => $score,
                        'action' => 'Use the meal planner feature and log your consumption regularly to build better habits.',
                        'impact' => 'medium',
                    ];
                    break;
            }
        }

        return $actionSteps;
    }

    /**
     * Estimate unit cost for item category
     *
     * @param string|null $category
     * @return float
     */
    private function estimateItemUnitCost(?string $category): float
    {
        $costs = [
            'fruit' => 3.00,
            'vegetable' => 2.50,
            'dairy' => 4.00,
            'grain' => 2.00,
            'protein' => 8.00,
            'other' => 3.50,
        ];

        return $costs[strtolower($category ?? 'other')] ?? 3.50;
    }
}
