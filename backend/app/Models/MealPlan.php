<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MealPlan extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'week_start_date',
        'plan_data',
        'shopping_list',
        'total_cost',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'week_start_date' => 'date',
        'plan_data' => 'array',
        'shopping_list' => 'array',
        'total_cost' => 'decimal:2',
    ];

    /**
     * Get the user that owns the meal plan.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
