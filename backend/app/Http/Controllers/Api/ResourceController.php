<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ResourceResource;
use App\Models\Resource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ResourceController extends Controller
{
    use ApiResponse;

    /**
     * Get resources with optional filters
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $query = Resource::query();

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->tags) {
            $tags = explode(',', $request->tags);
            $query->where(function ($q) use ($tags) {
                foreach ($tags as $tag) {
                    $q->orWhereJsonContains('tags', trim($tag));
                }
            });
        }

        $perPage = $request->get('per_page', 9);
        $resources = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Resources retrieved successfully',
            'data' => ResourceResource::collection($resources->items()),
            'pagination' => [
                'current_page' => $resources->currentPage(),
                'last_page' => $resources->lastPage(),
                'per_page' => $resources->perPage(),
                'total' => $resources->total(),
                'from' => $resources->firstItem(),
                'to' => $resources->lastItem(),
            ],
        ]);
    }

    /**
     * Get single resource
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $cacheKey = "resource_{$id}";
        $ttl = config('food_management.cache.resources_ttl', 1800);

        $resource = Cache::remember($cacheKey, $ttl, function () use ($id) {
            return Resource::findOrFail($id);
        });

        return $this->successResponse(
            new ResourceResource($resource),
            'Resource retrieved successfully'
        );
    }
}
