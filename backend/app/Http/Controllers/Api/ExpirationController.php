<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ConsumptionLog;
use App\Models\Inventory;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ExpirationController extends Controller
{
    /**
     * Get items at risk of expiration with risk scores
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getRisks(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            
            // Validate query parameter
            $threshold = $request->query('threshold', 50);
            $threshold = max(0, min(100, (int)$threshold)); // Clamp between 0-100

            // Fetch user's inventory items
            $inventoryItems = Inventory::where('user_id', $user->id)
                ->whereNotNull('expiration_date')
                ->get();

            if ($inventoryItems->isEmpty()) {
                return response()->json([
                    'message' => 'No inventory items with expiration dates found',
                    'highRiskItems' => [],
                    'priorityOrder' => [],
                    'summary' => [
                        'total' => 0,
                        'highRisk' => 0,
                        'mediumRisk' => 0,
                        'lowRisk' => 0,
                    ],
                ], 200);
            }

            // Get consumption frequency data for the user
            $consumptionFrequency = $this->getConsumptionFrequency($user->id);

            // Calculate risk scores for each item
            $riskItems = [];
            foreach ($inventoryItems as $item) {
                $riskData = $this->calculateRiskScore($item, $consumptionFrequency);
                
                if ($riskData['riskScore'] >= $threshold) {
                    $riskItems[] = $riskData;
                }
            }

            // Sort by risk score descending
            usort($riskItems, function ($a, $b) {
                return $b['riskScore'] - $a['riskScore'];
            });

            // Get priority order (item IDs)
            $priorityOrder = array_map(function ($item) {
                return $item['id'];
            }, $riskItems);

            // Calculate summary statistics
            $summary = $this->calculateSummary($inventoryItems, $consumptionFrequency);

            return response()->json([
                'message' => 'Risk assessment completed successfully',
                'highRiskItems' => $riskItems,
                'priorityOrder' => $priorityOrder,
                'summary' => $summary,
                'threshold' => $threshold,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Expiration Risk Calculation Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to calculate expiration risks',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Calculate risk score for an inventory item
     *
     * @param Inventory $item
     * @param array $consumptionFrequency
     * @return array
     */
    private function calculateRiskScore(Inventory $item, array $consumptionFrequency): array
    {
        $riskScore = 0;
        $riskFactors = [];
        $daysUntilExpiry = null;

        // Factor 1: Days until expiry (0-50 points)
        if ($item->expiration_date) {
            $daysUntilExpiry = Carbon::now()->diffInDays($item->expiration_date, false);
            
            if ($daysUntilExpiry < 0) {
                $riskScore += 100; // Already expired - maximum risk
                $riskFactors[] = 'Item has expired';
            } elseif ($daysUntilExpiry < 3) {
                $riskScore += 50;
                $riskFactors[] = 'Expires in less than 3 days';
            } elseif ($daysUntilExpiry <= 7) {
                $riskScore += 30;
                $riskFactors[] = 'Expires within a week';
            } elseif ($daysUntilExpiry <= 14) {
                $riskScore += 15;
                $riskFactors[] = 'Expires within 2 weeks';
            }
        }

        // Factor 2: Quantity (0-20 points)
        if ($item->quantity > 3) {
            $riskScore += 20;
            $riskFactors[] = 'Large quantity (' . $item->quantity . ' ' . $item->unit . ')';
        } elseif ($item->quantity > 5) {
            $riskScore += 30; // Extra points for very large quantities
            $riskFactors[] = 'Very large quantity (' . $item->quantity . ' ' . $item->unit . ')';
        }

        // Factor 3: Consumption frequency (0-20 points)
        $category = strtolower($item->category ?? 'other');
        $categoryFrequency = $consumptionFrequency[$category] ?? 0;
        
        if ($categoryFrequency == 0) {
            $riskScore += 20;
            $riskFactors[] = 'Category never consumed in last 30 days';
        } elseif ($categoryFrequency <= 2) {
            $riskScore += 10;
            $riskFactors[] = 'Category rarely consumed';
        }

        // Clamp risk score to maximum of 100
        $riskScore = min(100, $riskScore);

        // Determine risk level
        $riskLevel = $this->getRiskLevel($riskScore);

        // Generate recommendation
        $recommendation = $this->generateRecommendation($item, $riskScore, $daysUntilExpiry);

        // Generate reason summary
        $reason = !empty($riskFactors) 
            ? implode(', ', $riskFactors)
            : 'No significant risk factors';

        return [
            'id' => $item->id,
            'item' => $item->item_name,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'category' => $item->category,
            'expirationDate' => $item->expiration_date ? $item->expiration_date->toDateString() : null,
            'daysUntilExpiry' => $daysUntilExpiry,
            'riskScore' => $riskScore,
            'riskLevel' => $riskLevel,
            'riskFactors' => $riskFactors,
            'reason' => $reason,
            'recommendation' => $recommendation,
        ];
    }

    /**
     * Get consumption frequency by category for the last 30 days
     *
     * @param int $userId
     * @return array
     */
    private function getConsumptionFrequency(int $userId): array
    {
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        $consumptionLogs = ConsumptionLog::where('user_id', $userId)
            ->where('consumption_date', '>=', $thirtyDaysAgo)
            ->get();

        $frequency = [];
        foreach ($consumptionLogs as $log) {
            $category = strtolower($log->category ?? 'other');
            $frequency[$category] = ($frequency[$category] ?? 0) + 1;
        }

        return $frequency;
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
     * Generate recommendation based on risk factors
     *
     * @param Inventory $item
     * @param int $riskScore
     * @param int|null $daysUntilExpiry
     * @return string
     */
    private function generateRecommendation(Inventory $item, int $riskScore, ?int $daysUntilExpiry): string
    {
        // Already expired
        if ($daysUntilExpiry !== null && $daysUntilExpiry < 0) {
            return "Item has expired. Discard immediately and check for other expired items.";
        }

        // Critical risk (80-100)
        if ($riskScore >= 80) {
            if ($daysUntilExpiry !== null && $daysUntilExpiry <= 1) {
                return "Use {$item->item_name} in your next meal or freeze immediately to prevent waste.";
            }
            return "Freeze {$item->item_name} immediately or plan to use within the next 24-48 hours.";
        }

        // High risk (60-79)
        if ($riskScore >= 60) {
            if ($item->quantity > 3) {
                return "Large quantity expiring soon. Consider sharing with neighbors, donating to a food bank, or freezing portions.";
            }
            return "Plan to use {$item->item_name} in the next 2-3 days. Check our meal planner for recipe ideas.";
        }

        // Medium risk (40-59)
        if ($riskScore >= 40) {
            return "Use {$item->item_name} within the next week. Add to your meal plan to ensure it gets used.";
        }

        // Low risk (<40)
        return "Monitor {$item->item_name} and plan to use before expiration date.";
    }

    /**
     * Calculate summary statistics
     *
     * @param \Illuminate\Support\Collection $inventoryItems
     * @param array $consumptionFrequency
     * @return array
     */
    private function calculateSummary($inventoryItems, array $consumptionFrequency): array
    {
        $total = 0;
        $highRisk = 0;
        $mediumRisk = 0;
        $lowRisk = 0;

        foreach ($inventoryItems as $item) {
            $riskData = $this->calculateRiskScore($item, $consumptionFrequency);
            $total++;

            if ($riskData['riskScore'] >= 60) {
                $highRisk++;
            } elseif ($riskData['riskScore'] >= 40) {
                $mediumRisk++;
            } else {
                $lowRisk++;
            }
        }

        return [
            'total' => $total,
            'highRisk' => $highRisk,
            'mediumRisk' => $mediumRisk,
            'lowRisk' => $lowRisk,
            'criticalItems' => $highRisk,
            'actionRequired' => $highRisk + $mediumRisk,
        ];
    }
}
