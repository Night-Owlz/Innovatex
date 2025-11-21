<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WastePrediction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'prediction_date',
        'weekly_waste_grams',
        'weekly_waste_cost',
        'monthly_waste_grams',
        'monthly_waste_cost',
        'projected_yearly_grams',
        'projected_yearly_cost',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'prediction_date' => 'date',
        'weekly_waste_grams' => 'decimal:2',
        'weekly_waste_cost' => 'decimal:2',
        'monthly_waste_grams' => 'decimal:2',
        'monthly_waste_cost' => 'decimal:2',
        'projected_yearly_grams' => 'decimal:2',
        'projected_yearly_cost' => 'decimal:2',
    ];

    /**
     * Get the user that owns the waste prediction.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
