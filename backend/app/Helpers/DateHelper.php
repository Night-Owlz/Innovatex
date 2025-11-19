<?php

namespace App\Helpers;

use Carbon\Carbon;

class DateHelper
{
    /**
     * Get expiration status
     *
     * @param Carbon|null $expirationDate
     * @return string
     */
    public static function getExpirationStatus(?Carbon $expirationDate): string
    {
        if (!$expirationDate) {
            return 'no_expiration';
        }

        $now = Carbon::now();
        
        if ($expirationDate->lt($now)) {
            return 'expired';
        }
        
        if ($expirationDate->lte($now->copy()->addDays(3))) {
            return 'critical';
        }
        
        if ($expirationDate->lte($now->copy()->addDays(7))) {
            return 'warning';
        }
        
        return 'fresh';
    }

    /**
     * Get days until expiration
     *
     * @param Carbon|null $expirationDate
     * @return int|null
     */
    public static function getDaysUntilExpiration(?Carbon $expirationDate): ?int
    {
        if (!$expirationDate) {
            return null;
        }

        return Carbon::now()->diffInDays($expirationDate, false);
    }

    /**
     * Check if date is within range
     *
     * @param Carbon $date
     * @param int $days
     * @return bool
     */
    public static function isWithinDays(Carbon $date, int $days): bool
    {
        return $date->lte(Carbon::now()->addDays($days)) && $date->gte(Carbon::now());
    }

    /**
     * Format date for API response
     *
     * @param Carbon|null $date
     * @param string $format
     * @return string|null
     */
    public static function formatForApi(?Carbon $date, string $format = 'Y-m-d'): ?string
    {
        return $date?->format($format);
    }
}
