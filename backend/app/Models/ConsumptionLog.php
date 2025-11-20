<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ConsumptionLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'item_name',
        'quantity',
        'unit',
        'category',
        'consumption_date',
        'notes',
    ];

    protected $casts = [
        'consumption_date' => 'date',
    ];

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function imageUploads()
    {
        return $this->hasMany(ImageUpload::class, 'related_log_id');
    }

    /**
     * Query Scopes
     */
    public function scopeRecent(Builder $query, int $days = 7): Builder
    {
        return $query->whereDate('consumption_date', '>=', Carbon::now()->subDays($days));
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeFromDate(Builder $query, string $date): Builder
    {
        return $query->whereDate('consumption_date', '>=', $date);
    }

    public function scopeToDate(Builder $query, string $date): Builder
    {
        return $query->whereDate('consumption_date', '<=', $date);
    }

    public function scopeBetweenDates(Builder $query, string $startDate, string $endDate): Builder
    {
        return $query->whereBetween('consumption_date', [$startDate, $endDate]);
    }

    public function scopeThisWeek(Builder $query): Builder
    {
        return $query->whereBetween('consumption_date', [
            Carbon::now()->startOfWeek(),
            Carbon::now()->endOfWeek()
        ]);
    }

    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereBetween('consumption_date', [
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth()
        ]);
    }
}
