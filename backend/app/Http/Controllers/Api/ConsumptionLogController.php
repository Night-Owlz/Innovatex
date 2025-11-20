<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConsumptionLogRequest;
use App\Http\Resources\ConsumptionLogResource;
use App\Services\ConsumptionLogService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConsumptionLogController extends Controller
{
    use ApiResponse;

    public function __construct(private ConsumptionLogService $consumptionLogService)
    {
    }

    /**
     * Get paginated consumption logs with filters
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $filters = [
            'category' => $request->category,
            'date_from' => $request->date_from,
            'date_to' => $request->date_to,
            'per_page' => $request->per_page ?? 15,
        ];

        $logs = $this->consumptionLogService->getUserConsumptionLogs($request->user(), $filters);

        return $this->paginatedResponse(
            $logs->through(fn($log) => new ConsumptionLogResource($log)),
            'Consumption logs retrieved successfully'
        );
    }

    /**
     * Create new consumption log
     *
     * @param StoreConsumptionLogRequest $request
     * @return JsonResponse
     */
    public function store(StoreConsumptionLogRequest $request): JsonResponse
    {
        $log = $this->consumptionLogService->createConsumptionLog(
            $request->user(),
            $request->validated()
        );

        return $this->createdResponse(
            new ConsumptionLogResource($log),
            'Consumption log created successfully'
        );
    }

    /**
     * Get single consumption log
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $log = $request->user()->consumptionLogs()->findOrFail($id);

        return $this->successResponse(
            new ConsumptionLogResource($log),
            'Consumption log retrieved successfully'
        );
    }

    /**
     * Delete consumption log
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $log = $request->user()->consumptionLogs()->findOrFail($id);
        
        $this->consumptionLogService->deleteConsumptionLog($log);

        return $this->deletedResponse('Consumption log deleted successfully');
    }
}
