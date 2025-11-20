<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\FoodItemResource;
use App\Models\FoodItem;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class FoodItemController extends Controller
{
    use ApiResponse;

    /**
     * Get food items with optional filters
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $cacheKey = 'food_items_' . md5(json_encode($request->all()));
        $ttl = config('food_management.cache.food_items_ttl', 3600);

        $foodItems = Cache::remember($cacheKey, $ttl, function () use ($request) {
            $query = FoodItem::query();

            if ($request->category) {
                $query->where('category', $request->category);
            }

            if ($request->search) {
                $query->where('name', 'like', '%' . $request->search . '%');
            }

            return $query->get();
        });

        return $this->successResponse(
            FoodItemResource::collection($foodItems),
            'Food items retrieved successfully'
        );
    }

    /**
     * Get single food item
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $cacheKey = "food_item_{$id}";
        $ttl = config('food_management.cache.food_items_ttl', 3600);

        $foodItem = Cache::remember($cacheKey, $ttl, function () use ($id) {
            return FoodItem::findOrFail($id);
        });

        return $this->successResponse(
            new FoodItemResource($foodItem),
            'Food item retrieved successfully'
        );
    }
}
