<?php

namespace App\Services;

use App\Models\Resource;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class RecommendationService
{
    private const MAX_RECOMMENDATIONS = 5;
    private const EXPIRING_SOON_THRESHOLD = 3;
    private const ACTIVITY_PERIOD_DAYS = 30;

    /**
     * Generate personalized recommendations for user
     *
     * @param User $user
     * @return array
     */
    public function generateRecommendations(User $user): array
    {
        $recommendations = collect();

        // Get waste reduction resources if items are expiring
        $expiringItemsCount = $this->getExpiringItemsCount($user);
        if ($expiringItemsCount > 0) {
            $wasteReductionResources = $this->getWasteReductionResources($expiringItemsCount);
            $recommendations = $recommendations->merge($wasteReductionResources);
        }

        // Get category-based recommendations
        $userCategories = $this->getUserCategories($user);
        $categoryResources = $this->getCategoryResources($userCategories);
        $recommendations = $recommendations->merge($categoryResources);

        // Fill remaining slots with general recommendations
        if ($recommendations->count() < self::MAX_RECOMMENDATIONS) {
            $generalResources = $this->getGeneralResources(
                $recommendations->pluck('id')->toArray(),
                self::MAX_RECOMMENDATIONS - $recommendations->count()
            );
            $recommendations = $recommendations->merge($generalResources);
        }

        return $recommendations->take(self::MAX_RECOMMENDATIONS)->values()->all();
    }

    /**
     * Get count of items expiring soon
     *
     * @param User $user
     * @return int
     */
    private function getExpiringItemsCount(User $user): int
    {
        return $user->inventories()
            ->whereNotNull('expiration_date')
            ->whereDate('expiration_date', '<=', Carbon::now()->addDays(self::EXPIRING_SOON_THRESHOLD))
            ->count();
    }

    /**
     * Get waste reduction resources
     *
     * @param int $expiringItemsCount
     * @return Collection
     */
    private function getWasteReductionResources(int $expiringItemsCount): Collection
    {
        return Resource::where('category', 'waste_reduction')
            ->limit(2)
            ->get()
            ->map(function ($resource) use ($expiringItemsCount) {
                return [
                    'id' => $resource->id,
                    'title' => $resource->title,
                    'description' => $resource->description,
                    'category' => $resource->category,
                    'content_url' => $resource->content_url,
                    'tags' => $resource->tags,
                    'reason' => "You have {$expiringItemsCount} item(s) expiring soon - these tips can help reduce waste",
                ];
            });
    }

    /**
     * Get user's active categories from logs and inventory
     *
     * @param User $user
     * @return array
     */
    private function getUserCategories(User $user): array
    {
        $recentLogs = $user->consumptionLogs()
            ->whereDate('consumption_date', '>=', Carbon::now()->subDays(self::ACTIVITY_PERIOD_DAYS))
            ->get();

        $inventory = $user->inventories()->get();

        return $recentLogs->pluck('category')
            ->merge($inventory->pluck('category'))
            ->unique()
            ->toArray();
    }

    /**
     * Get resources based on user categories
     *
     * @param array $categories
     * @return Collection
     */
    private function getCategoryResources(array $categories): Collection
    {
        $resources = collect();

        foreach ($categories as $category) {
            $categoryResource = Resource::where(function ($query) use ($category) {
                $query->whereJsonContains('tags', $category)
                    ->orWhereJsonContains('tags', strtolower($category));
            })
                ->first();

            if ($categoryResource) {
                $resources->push([
                    'id' => $categoryResource->id,
                    'title' => $categoryResource->title,
                    'description' => $categoryResource->description,
                    'category' => $categoryResource->category,
                    'content_url' => $categoryResource->content_url,
                    'tags' => $categoryResource->tags,
                    'reason' => "Related to your {$category} consumption",
                ]);
            }
        }

        return $resources;
    }

    /**
     * Get general recommendations to fill remaining slots
     *
     * @param array $excludeIds
     * @param int $limit
     * @return Collection
     */
    private function getGeneralResources(array $excludeIds, int $limit): Collection
    {
        return Resource::whereNotIn('id', $excludeIds)
            ->limit($limit)
            ->get()
            ->map(function ($resource) {
                return [
                    'id' => $resource->id,
                    'title' => $resource->title,
                    'description' => $resource->description,
                    'category' => $resource->category,
                    'content_url' => $resource->content_url,
                    'tags' => $resource->tags,
                    'reason' => 'Recommended for you',
                ];
            });
    }
}
