<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ConsumptionPattern extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'analysis_date',
        'weekly_trends',
        'over_consumption',
        'under_consumption',
        'waste_risk_items',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'analysis_date' => 'date',
        'weekly_trends' => 'array',
        'over_consumption' => 'array',
        'under_consumption' => 'array',
        'waste_risk_items' => 'array',
    ];

    /**
     * Get the user that owns the consumption pattern.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
