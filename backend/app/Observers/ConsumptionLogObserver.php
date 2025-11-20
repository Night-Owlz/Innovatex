<?php

namespace App\Observers;

use App\Models\ConsumptionLog;
use Illuminate\Support\Facades\Cache;

class ConsumptionLogObserver
{
    /**
     * Handle the ConsumptionLog "created" event.
     */
    public function created(ConsumptionLog $consumptionLog): void
    {
        $this->clearUserCache($consumptionLog->user_id);
    }

    /**
     * Handle the ConsumptionLog "updated" event.
     */
    public function updated(ConsumptionLog $consumptionLog): void
    {
        $this->clearUserCache($consumptionLog->user_id);
    }

    /**
     * Handle the ConsumptionLog "deleted" event.
     */
    public function deleted(ConsumptionLog $consumptionLog): void
    {
        $this->clearUserCache($consumptionLog->user_id);
    }

    /**
     * Clear cache for user
     */
    private function clearUserCache(int $userId): void
    {
        // Clear dashboard cache for this user
        Cache::forget("dashboard_summary_{$userId}");
        Cache::forget("user_recommendations_{$userId}");
    }
}
