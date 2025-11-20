<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ConsumptionLogResource;
use App\Http\Resources\InventoryResource;
use App\Services\DashboardService;
use App\Services\RecommendationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private DashboardService $dashboardService,
        private RecommendationService $recommendationService
    ) {
    }

    /**
     * Get dashboard summary
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function summary(Request $request): JsonResponse
    {
        $summary = $this->dashboardService->getDashboardSummary($request->user());

        return $this->successResponse([
            'total_inventory_items' => $summary['total_inventory_items'],
            'items_expiring_soon' => $summary['items_expiring_soon'],
            'recent_logs_count' => $summary['recent_logs_count'],
            'recent_logs' => ConsumptionLogResource::collection($summary['recent_logs']),
            'expiring_inventory' => InventoryResource::collection($summary['expiring_inventory']),
            'recommended_resources' => $summary['recommended_resources'],
        ], 'Dashboard summary retrieved successfully');
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
}
