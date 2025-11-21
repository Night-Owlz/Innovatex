<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ImpactScore extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'score_date',
        'overall_score',
        'waste_reduction_score',
        'nutrition_balance_score',
        'inventory_utilization_score',
        'sustainable_practices_score',
        'insights',
        'action_steps',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'score_date' => 'date',
        'overall_score' => 'decimal:2',
        'waste_reduction_score' => 'decimal:2',
        'nutrition_balance_score' => 'decimal:2',
        'inventory_utilization_score' => 'decimal:2',
        'sustainable_practices_score' => 'decimal:2',
        'action_steps' => 'array',
    ];

    /**
     * Get the user that owns the impact score.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
