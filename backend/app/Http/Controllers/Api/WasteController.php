<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\WastePrediction;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WasteController extends Controller
{
    /**
     * Community averages for comparison
     */
    private const COMMUNITY_AVERAGE_YEARLY_KG = 120000; // 120kg in grams
    private const COMMUNITY_AVERAGE_YEARLY_COST = 1200; // $1200 per year

    /**
     * Get waste estimation and predictions
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function estimation(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $today = Carbon::today();

            // Calculate current week waste
            $currentWeekWaste = $this->calculateCurrentWeekWaste($user->id);

            // Calculate current month waste
            $currentMonthWaste = $this->calculateCurrentMonthWaste($user->id);

            // Project yearly waste based on historical data
            $projectedYearlyWaste = $this->projectYearlyWaste($user->id);

            // Get community averages
            $communityAverage = [
                'grams' => self::COMMUNITY_AVERAGE_YEARLY_KG,
                'cost' => self::COMMUNITY_AVERAGE_YEARLY_COST,
            ];

            // Calculate comparison
            $comparison = $this->calculateComparison(
                $projectedYearlyWaste['grams'],
                $projectedYearlyWaste['cost']
            );

            // Save prediction to database
            $prediction = WastePrediction::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'prediction_date' => $today,
                ],
                [
                    'weekly_waste_grams' => $currentWeekWaste['grams'],
                    'weekly_waste_cost' => $currentWeekWaste['cost'],
                    'monthly_waste_grams' => $currentMonthWaste['grams'],
                    'monthly_waste_cost' => $currentMonthWaste['cost'],
                    'projected_yearly_grams' => $projectedYearlyWaste['grams'],
                    'projected_yearly_cost' => $projectedYearlyWaste['cost'],
                ]
            );

            return response()->json([
                'message' => 'Waste estimation calculated successfully',
                'currentWeekWaste' => $currentWeekWaste,
                'currentMonthWaste' => $currentMonthWaste,
                'projectedYearlyWaste' => $projectedYearlyWaste,
                'communityAverage' => $communityAverage,
                'comparison' => $comparison,
                'predictionDate' => $today->toDateString(),
                'recommendations' => $this->generateRecommendations($comparison),
            ], 200);

        } catch (\Exception $e) {
            Log::error('Waste Estimation Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to calculate waste estimation',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Calculate current week waste
     *
     * @param int $userId
     * @return array
     */
    private function calculateCurrentWeekWaste(int $userId): array
    {
        $weekStart = Carbon::now()->startOfWeek();
        $weekEnd = Carbon::now()->endOfWeek();

        // Get expired items from this week
        $expiredItems = Inventory::where('user_id', $userId)
            ->whereNotNull('expiration_date')
            ->where('expiration_date', '<', Carbon::now())
            ->where('expiration_date', '>=', $weekStart)
            ->get();

        $totalGrams = 0;
        $totalCost = 0;

        foreach ($expiredItems as $item) {
            // Convert quantity to grams (assuming kg by default)
            $grams = $this->convertToGrams($item->quantity, $item->unit);
            $cost = $this->estimateItemCost($item);

            $totalGrams += $grams;
            $totalCost += $cost;
        }

        return [
            'grams' => round($totalGrams, 2),
            'cost' => round($totalCost, 2),
            'itemCount' => $expiredItems->count(),
        ];
    }

    /**
     * Calculate current month waste
     *
     * @param int $userId
     * @return array
     */
    private function calculateCurrentMonthWaste(int $userId): array
    {
        $monthStart = Carbon::now()->startOfMonth();
        $monthEnd = Carbon::now()->endOfMonth();

        // Get expired items from this month
        $expiredItems = Inventory::where('user_id', $userId)
            ->whereNotNull('expiration_date')
            ->where('expiration_date', '<', Carbon::now())
            ->where('expiration_date', '>=', $monthStart)
            ->get();

        $totalGrams = 0;
        $totalCost = 0;

        foreach ($expiredItems as $item) {
            $grams = $this->convertToGrams($item->quantity, $item->unit);
            $cost = $this->estimateItemCost($item);

            $totalGrams += $grams;
            $totalCost += $cost;
        }

        return [
            'grams' => round($totalGrams, 2),
            'cost' => round($totalCost, 2),
            'itemCount' => $expiredItems->count(),
        ];
    }

    /**
     * Project yearly waste based on historical data
     *
     * @param int $userId
     * @return array
     */
    private function projectYearlyWaste(int $userId): array
    {
        // Get all historical waste data (up to 1 year)
        $oneYearAgo = Carbon::now()->subYear();

        $expiredItems = Inventory::where('user_id', $userId)
            ->whereNotNull('expiration_date')
            ->where('expiration_date', '<', Carbon::now())
            ->where('expiration_date', '>=', $oneYearAgo)
            ->get();

        if ($expiredItems->isEmpty()) {
            // No historical data - use conservative estimate
            return [
                'grams' => 0,
                'cost' => 0,
                'confidence' => 'low',
                'message' => 'Insufficient data for accurate projection',
            ];
        }

        $totalGrams = 0;
        $totalCost = 0;

        foreach ($expiredItems as $item) {
            $grams = $this->convertToGrams($item->quantity, $item->unit);
            $cost = $this->estimateItemCost($item);

            $totalGrams += $grams;
            $totalCost += $cost;
        }

        // Calculate days of data available
        $oldestItem = $expiredItems->sortBy('expiration_date')->first();
        $daysOfData = Carbon::parse($oldestItem->expiration_date)->diffInDays(Carbon::now());
        $daysOfData = max(1, $daysOfData); // Prevent division by zero

        // Project to yearly based on available data
        $dailyAverageGrams = $totalGrams / $daysOfData;
        $dailyAverageCost = $totalCost / $daysOfData;

        $projectedYearlyGrams = $dailyAverageGrams * 365;
        $projectedYearlyCost = $dailyAverageCost * 365;

        // Determine confidence based on data availability
        $confidence = 'high';
        if ($daysOfData < 30) {
            $confidence = 'low';
        } elseif ($daysOfData < 90) {
            $confidence = 'medium';
        }

        return [
            'grams' => round($projectedYearlyGrams, 2),
            'cost' => round($projectedYearlyCost, 2),
            'confidence' => $confidence,
            'daysOfData' => $daysOfData,
        ];
    }

    /**
     * Calculate comparison with community average
     *
     * @param float $userYearlyGrams
     * @param float $userYearlyCost
     * @return array
     */
    private function calculateComparison(float $userYearlyGrams, float $userYearlyCost): array
    {
        if ($userYearlyGrams == 0) {
            return [
                'percentageOfAverage' => 0,
                'status' => 'excellent',
                'message' => 'No waste detected! Keep up the excellent work!',
                'savingsVsAverage' => [
                    'grams' => self::COMMUNITY_AVERAGE_YEARLY_KG,
                    'cost' => self::COMMUNITY_AVERAGE_YEARLY_COST,
                ],
            ];
        }

        $percentageGrams = ($userYearlyGrams / self::COMMUNITY_AVERAGE_YEARLY_KG) * 100;
        $percentageCost = ($userYearlyCost / self::COMMUNITY_AVERAGE_YEARLY_COST) * 100;

        // Use cost percentage as primary metric
        $percentageOfAverage = $percentageCost;

        // Determine status
        $status = 'needs-improvement';
        $message = '';

        if ($percentageOfAverage <= 50) {
            $status = 'excellent';
            $message = "Outstanding! You're wasting 50% less than the community average!";
        } elseif ($percentageOfAverage <= 75) {
            $status = 'good';
            $message = "Good job! You're below the community average in food waste.";
        } elseif ($percentageOfAverage <= 100) {
            $status = 'average';
            $message = "You're at the community average. There's room for improvement.";
        } else {
            $status = 'needs-improvement';
            $message = "You're wasting more than average. Let's work on reducing waste together.";
        }

        // Calculate savings (or excess) vs average
        $savingsGrams = self::COMMUNITY_AVERAGE_YEARLY_KG - $userYearlyGrams;
        $savingsCost = self::COMMUNITY_AVERAGE_YEARLY_COST - $userYearlyCost;

        return [
            'percentageOfAverage' => round($percentageOfAverage, 1),
            'status' => $status,
            'message' => $message,
            'savingsVsAverage' => [
                'grams' => round($savingsGrams, 2),
                'cost' => round($savingsCost, 2),
            ],
        ];
    }

    /**
     * Convert quantity to grams based on unit
     *
     * @param float $quantity
     * @param string|null $unit
     * @return float
     */
    private function convertToGrams(float $quantity, ?string $unit): float
    {
        $unit = strtolower($unit ?? 'g');

        $conversions = [
            'kg' => 1000,
            'g' => 1,
            'l' => 1000, // Approximate (1L water = 1kg)
            'ml' => 1,
            'lb' => 453.592,
            'oz' => 28.3495,
            'pcs' => 100, // Average item weight
            'slices' => 30, // Average slice weight
            'cup' => 240,
            'tbsp' => 15,
            'tsp' => 5,
        ];

        $multiplier = $conversions[$unit] ?? 100; // Default 100g per unit

        return $quantity * $multiplier;
    }

    /**
     * Estimate cost for inventory item
     *
     * @param Inventory $item
     * @return float
     */
    private function estimateItemCost(Inventory $item): float
    {
        $unitCosts = [
            'fruit' => 3.00,
            'vegetable' => 2.50,
            'dairy' => 4.00,
            'grain' => 2.00,
            'protein' => 8.00,
            'other' => 3.50,
        ];

        $unitCost = $unitCosts[strtolower($item->category ?? 'other')] ?? 3.50;

        return $item->quantity * $unitCost;
    }

    /**
     * Generate recommendations based on comparison
     *
     * @param array $comparison
     * @return array
     */
    private function generateRecommendations(array $comparison): array
    {
        $recommendations = [];

        if ($comparison['status'] === 'excellent') {
            $recommendations[] = "Keep up the great work! Share your strategies with others.";
            $recommendations[] = "Consider composting any unavoidable waste to close the loop.";
        } elseif ($comparison['status'] === 'good') {
            $recommendations[] = "You're doing well! Focus on meal planning to reduce waste further.";
            $recommendations[] = "Check inventory before shopping to avoid duplicate purchases.";
        } else {
            $recommendations[] = "Use the meal planner to plan ahead and reduce waste.";
            $recommendations[] = "Set up expiration alerts to use items before they spoil.";
            $recommendations[] = "Store food properly to extend shelf life.";
            $recommendations[] = "Consider freezing items that are about to expire.";
        }

        return $recommendations;
    }
}
