<?php

namespace App\Observers;

use App\Models\Inventory;
use Illuminate\Support\Facades\Cache;

class InventoryObserver
{
    /**
     * Handle the Inventory "created" event.
     */
    public function created(Inventory $inventory): void
    {
        $this->clearUserCache($inventory->user_id);
    }

    /**
     * Handle the Inventory "updated" event.
     */
    public function updated(Inventory $inventory): void
    {
        $this->clearUserCache($inventory->user_id);
    }

    /**
     * Handle the Inventory "deleted" event.
     */
    public function deleted(Inventory $inventory): void
    {
        $this->clearUserCache($inventory->user_id);
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
