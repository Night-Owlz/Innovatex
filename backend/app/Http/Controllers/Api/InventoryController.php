<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInventoryRequest;
use App\Http\Requests\UpdateInventoryRequest;
use App\Http\Resources\InventoryResource;
use App\Services\InventoryService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    use ApiResponse;

    public function __construct(private InventoryService $inventoryService)
    {
    }

    /**
     * Get paginated inventory list with filters
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'category' => $request->category,
            'expiring_soon' => $request->boolean('expiring_soon'),
            'days_threshold' => $request->days_threshold ?? 7,
            'per_page' => $request->per_page ?? 15,
        ];

        $inventories = $this->inventoryService->getUserInventory($request->user(), $filters);

        return $this->paginatedResponse(
            $inventories->through(fn($item) => new InventoryResource($item)),
            'Inventory retrieved successfully'
        );
    }

    /**
     * Create new inventory item
     *
     * @param StoreInventoryRequest $request
     * @return JsonResponse
     */
    public function store(StoreInventoryRequest $request): JsonResponse
    {
        $inventory = $this->inventoryService->createInventoryItem(
            $request->user(),
            $request->validated()
        );

        return $this->createdResponse(
            new InventoryResource($inventory),
            'Inventory item created successfully'
        );
    }

    /**
     * Get single inventory item
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $inventory = $request->user()->inventories()->with('foodItem')->findOrFail($id);

        return $this->successResponse(
            new InventoryResource($inventory),
            'Inventory item retrieved successfully'
        );
    }

    /**
     * Update inventory item
     *
     * @param UpdateInventoryRequest $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(UpdateInventoryRequest $request, int $id): JsonResponse
    {
        $inventory = $request->user()->inventories()->findOrFail($id);
        
        $updatedInventory = $this->inventoryService->updateInventoryItem(
            $inventory,
            $request->validated()
        );

        return $this->updatedResponse(
            new InventoryResource($updatedInventory),
            'Inventory item updated successfully'
        );
    }

    /**
     * Delete inventory item
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $inventory = $request->user()->inventories()->findOrFail($id);
        
        $this->inventoryService->deleteInventoryItem($inventory);

        return $this->deletedResponse('Inventory item deleted successfully');
    }
}
