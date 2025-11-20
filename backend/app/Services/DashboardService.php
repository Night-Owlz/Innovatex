<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Collection;

class DashboardService
{
    public function __construct(
        private InventoryService $inventoryService,
        private ConsumptionLogService $consumptionLogService,
        private RecommendationService $recommendationService
    ) {}

    /**
     * Get comprehensive dashboard summary for user
     *
     * @param User $user
     * @return array
     */
    public function getDashboardSummary(User $user): array
    {
        return [
            'total_inventory_items' => $this->inventoryService->getTotalInventoryCount($user),
            'items_expiring_soon' => $this->inventoryService->getExpiringItemsCount($user, 7),
            'recent_logs_count' => $this->consumptionLogService->getRecentLogsCount($user, 7),
            'recent_logs' => $this->consumptionLogService->getRecentLogs($user, 7, 5),
            'expiring_inventory' => $this->inventoryService->getExpiringItems($user, 7)->take(5),
            'recommended_resources' => $this->recommendationService->generateRecommendations($user),
        ];
    }

    /**
     * Get statistics for user's consumption patterns
     *
     * @param User $user
     * @param int $days
     * @return array
     */
    public function getConsumptionStatistics(User $user, int $days = 30): array
    {
        $logs = $this->consumptionLogService->getRecentLogs($user, $days, 1000);

        return [
            'total_items_consumed' => $logs->count(),
            'total_quantity' => $logs->sum('quantity'),
            'categories_breakdown' => $this->getCategoryBreakdown($logs),
            'average_daily_consumption' => round($logs->count() / max($days, 1), 2),
        ];
    }

    /**
     * Get breakdown by category
     *
     * @param Collection $logs
     * @return array
     */
    private function getCategoryBreakdown(Collection $logs): array
    {
        return $logs->groupBy('category')
            ->map(function ($categoryLogs, $category) {
                return [
                    'category' => $category,
                    'count' => $categoryLogs->count(),
                    'total_quantity' => $categoryLogs->sum('quantity'),
                ];
            })
            ->values()
            ->toArray();
    }
}
