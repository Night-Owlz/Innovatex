<?php

namespace App\Services;

use App\Models\Inventory;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class InventoryService
{
    /**
     * Get paginated inventory for user with filters
     *
     * @param User $user
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getUserInventory(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = $user->inventories()->with('foodItem')->latest();

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['expiring_soon'])) {
            $query->expiringSoon($filters['days_threshold'] ?? 7);
        }

        $perPage = $filters['per_page'] ?? config('food_management.pagination.default', 15);

        return $query->paginate($perPage);
    }

    /**
     * Create inventory item for user
     *
     * @param User $user
     * @param array $data
     * @return Inventory
     */
    public function createInventoryItem(User $user, array $data): Inventory
    {
        $inventory = $user->inventories()->create($data);
        $inventory->load('foodItem');

        return $inventory;
    }

    /**
     * Update inventory item
     *
     * @param Inventory $inventory
     * @param array $data
     * @return Inventory
     */
    public function updateInventoryItem(Inventory $inventory, array $data): Inventory
    {
        $inventory->update($data);
        $inventory->load('foodItem');

        return $inventory;
    }

    /**
     * Delete inventory item
     *
     * @param Inventory $inventory
     * @return bool
     */
    public function deleteInventoryItem(Inventory $inventory): bool
    {
        return $inventory->delete();
    }

    /**
     * Get items expiring within specified days
     *
     * @param User $user
     * @param int $days
     * @return Collection
     */
    public function getExpiringItems(User $user, int $days = 7): Collection
    {
        return $user->inventories()
            ->with('foodItem')
            ->expiringSoon($days)
            ->get();
    }

    /**
     * Get count of items expiring soon
     *
     * @param User $user
     * @param int $days
     * @return int
     */
    public function getExpiringItemsCount(User $user, int $days = 7): int
    {
        return $user->inventories()
            ->expiringSoon($days)
            ->count();
    }

    /**
     * Get total inventory count for user
     *
     * @param User $user
     * @return int
     */
    public function getTotalInventoryCount(User $user): int
    {
        return $user->inventories()->count();
    }
}
