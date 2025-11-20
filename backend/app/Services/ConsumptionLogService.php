<?php

namespace App\Services;

use App\Models\ConsumptionLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ConsumptionLogService
{
    /**
     * Get paginated consumption logs for user with filters
     *
     * @param User $user
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getUserConsumptionLogs(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = $user->consumptionLogs()->latest();

        if (!empty($filters['category'])) {
            $query->byCategory($filters['category']);
        }

        if (!empty($filters['date_from'])) {
            $query->fromDate($filters['date_from']);
        }

        if (!empty($filters['date_to'])) {
            $query->toDate($filters['date_to']);
        }

        $perPage = $filters['per_page'] ?? config('app.pagination.default', 15);

        return $query->paginate($perPage);
    }

    /**
     * Create consumption log for user
     *
     * @param User $user
     * @param array $data
     * @return ConsumptionLog
     */
    public function createConsumptionLog(User $user, array $data): ConsumptionLog
    {
        return $user->consumptionLogs()->create($data);
    }

    /**
     * Delete consumption log
     *
     * @param ConsumptionLog $log
     * @return bool
     */
    public function deleteConsumptionLog(ConsumptionLog $log): bool
    {
        return $log->delete();
    }

    /**
     * Get recent logs for user
     *
     * @param User $user
     * @param int $days
     * @param int $limit
     * @return Collection
     */
    public function getRecentLogs(User $user, int $days = 7, int $limit = 5): Collection
    {
        return $user->consumptionLogs()
            ->recent($days)
            ->limit($limit)
            ->get();
    }

    /**
     * Get count of recent logs
     *
     * @param User $user
     * @param int $days
     * @return int
     */
    public function getRecentLogsCount(User $user, int $days = 7): int
    {
        return $user->consumptionLogs()
            ->recent($days)
            ->count();
    }

    /**
     * Get logs for specific date range
     *
     * @param User $user
     * @param Carbon $startDate
     * @param Carbon $endDate
     * @return Collection
     */
    public function getLogsForDateRange(User $user, Carbon $startDate, Carbon $endDate): Collection
    {
        return $user->consumptionLogs()
            ->whereBetween('consumption_date', [$startDate, $endDate])
            ->orderBy('consumption_date', 'desc')
            ->get();
    }
}
