<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConsumptionLogResource;
use App\Http\Resources\InventoryResource;
use App\Models\ConsumptionLog;
use App\Models\Inventory;
use App\Models\Resource;
use App\Services\DashboardService;
use App\Services\RecommendationService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private DashboardService $dashboardService,
        private RecommendationService $recommendationService
    ) {
    }

    /**
     * Get dashboard summary (Optimized version)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $sevenDaysAgo = Carbon::now()->subDays(7);
            $sevenDaysFromNow = Carbon::now()->addDays(7);

            // Single query to get all inventory data with counts
            $inventoryQuery = Inventory::where('user_id', $user->id);
            
            // Clone query for different purposes to optimize
            $totalInventoryItems = (clone $inventoryQuery)->count();
            
            $itemsExpiringSoon = (clone $inventoryQuery)
                ->whereNotNull('expiration_date')
                ->where('expiration_date', '>=', Carbon::now())
                ->where('expiration_date', '<=', $sevenDaysFromNow)
                ->count();

            // Get all inventory items for risk calculation (reuse for high risk items)
            $allInventoryItems = (clone $inventoryQuery)
                ->whereNotNull('expiration_date')
                ->get();

            // Single query to get recent consumption logs with count
            $recentLogsQuery = ConsumptionLog::where('user_id', $user->id)
                ->where('consumption_date', '>=', $sevenDaysAgo)
                ->orderBy('consumption_date', 'desc');

            $recentLogsCount = (clone $recentLogsQuery)->count();
            $recentLogs = (clone $recentLogsQuery)->limit(5)->get();

            // Calculate high risk items (top 3) using optimized logic
            $highRiskItems = $this->getHighRiskItems($allInventoryItems, $user->id);

            // Generate recommended resources based on consumption categories
            $recommendedResources = $this->getRecommendedResources($recentLogs);

            return response()->json([
                'message' => 'Dashboard summary retrieved successfully',
                'totalInventoryItems' => $totalInventoryItems,
                'itemsExpiringSoon' => $itemsExpiringSoon,
                'recentLogsCount' => $recentLogsCount,
                'recentLogs' => $recentLogs->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'itemName' => $log->item_name,
                        'quantity' => $log->quantity,
                        'unit' => $log->unit,
                        'category' => $log->category,
                        'consumptionDate' => $log->consumption_date->toDateString(),
                        'notes' => $log->notes,
                    ];
                }),
                'highRiskItems' => $highRiskItems,
                'recommendedResources' => $recommendedResources,
            ], 200);

        } catch (\Exception $e) {
            Log::error('Dashboard Summary Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve dashboard summary',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred',
            ], 500);
        }
    }

    /**
     * Get personalized recommendations
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function recommendations(Request $request): JsonResponse
    {
        $recommendations = $this->recommendationService->generateRecommendations($request->user());

        return $this->successResponse([
            'resources' => $recommendations,
        ], 'Recommendations generated successfully');
    }

    /**
     * Get top 3 high risk items from inventory
     * Reuses ExpirationController logic without additional queries
     *
     * @param \Illuminate\Support\Collection $inventoryItems
     * @param int $userId
     * @return array
     */
    private function getHighRiskItems($inventoryItems, int $userId): array
    {
        if ($inventoryItems->isEmpty()) {
            return [];
        }

        // Get consumption frequency (single query)
        $consumptionFrequency = $this->getConsumptionFrequency($userId);

        $riskItems = [];
        foreach ($inventoryItems as $item) {
            $riskData = $this->calculateRiskScore($item, $consumptionFrequency);
            
            if ($riskData['riskScore'] >= 50) {
                $riskItems[] = $riskData;
            }
        }

        // Sort by risk score descending and get top 3
        usort($riskItems, function ($a, $b) {
            return $b['riskScore'] - $a['riskScore'];
        });

        return array_slice($riskItems, 0, 3);
    }

    /**
     * Calculate risk score for an inventory item
     * (Same logic as ExpirationController)
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

        // Factor 1: Days until expiry
        if ($item->expiration_date) {
            $daysUntilExpiry = Carbon::now()->diffInDays($item->expiration_date, false);
            
            if ($daysUntilExpiry < 0) {
                $riskScore += 100;
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

        // Factor 2: Quantity
        if ($item->quantity > 5) {
            $riskScore += 30;
            $riskFactors[] = 'Very large quantity';
        } elseif ($item->quantity > 3) {
            $riskScore += 20;
            $riskFactors[] = 'Large quantity';
        }

        // Factor 3: Consumption frequency
        $category = strtolower($item->category ?? 'other');
        $categoryFrequency = $consumptionFrequency[$category] ?? 0;
        
        if ($categoryFrequency == 0) {
            $riskScore += 20;
            $riskFactors[] = 'Category rarely consumed';
        } elseif ($categoryFrequency <= 2) {
            $riskScore += 10;
            $riskFactors[] = 'Low consumption frequency';
        }

        $riskScore = min(100, $riskScore);

        return [
            'id' => $item->id,
            'item' => $item->item_name,
            'quantity' => $item->quantity,
            'unit' => $item->unit,
            'category' => $item->category,
            'expirationDate' => $item->expiration_date ? $item->expiration_date->toDateString() : null,
            'daysUntilExpiry' => $daysUntilExpiry,
            'riskScore' => $riskScore,
            'riskLevel' => $this->getRiskLevel($riskScore),
            'riskFactors' => $riskFactors,
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
            ->select('category')
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
     * Generate recommended resources based on consumption patterns
     *
     * @param \Illuminate\Support\Collection $recentLogs
     * @return array
     */
    private function getRecommendedResources($recentLogs): array
    {
        // Get categories from recent consumption
        $categories = $recentLogs->pluck('category')
            ->filter()
            ->map(function ($category) {
                return strtolower(trim($category));
            })
            ->unique()
            ->values()
            ->toArray();

        if (empty($categories)) {
            // Default resources if no consumption data
            $resources = Resource::inRandomOrder()
                ->limit(3)
                ->get();
        } else {
            // Get resources related to consumed categories
            $resources = Resource::where(function ($query) use ($categories) {
                foreach ($categories as $category) {
                    $query->orWhere('title', 'like', '%' . $category . '%')
                          ->orWhere('description', 'like', '%' . $category . '%')
                          ->orWhere('category', 'like', '%' . $category . '%');
                }
            })
            ->limit(3)
            ->get();

            // If not enough resources found, fill with random ones
            if ($resources->count() < 3) {
                $additionalResources = Resource::whereNotIn('id', $resources->pluck('id'))
                    ->inRandomOrder()
                    ->limit(3 - $resources->count())
                    ->get();
                
                $resources = $resources->merge($additionalResources);
            }
        }

        return $resources->map(function ($resource) {
            return [
                'id' => $resource->id,
                'title' => $resource->title,
                'description' => $resource->description,
                'category' => $resource->category ?? 'general',
                'url' => $resource->url ?? null,
                'imageUrl' => $resource->image_url ?? null,
            ];
        })->toArray();
    }
}
