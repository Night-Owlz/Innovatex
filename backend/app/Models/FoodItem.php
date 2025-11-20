<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * FoodItem Model
 *
 * @property int $id
 * @property string $name
 * @property string $category
 * @property int|null $typical_expiration_days
 * @property float|null $cost_per_unit
 * @property string|null $unit
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<Inventory> $inventories
 */
class FoodItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'typical_expiration_days',
        'cost_per_unit',
        'unit',
    ];

    protected $casts = [
        'typical_expiration_days' => 'integer',
        'cost_per_unit' => 'float',
    ];

    /**
     * Get the inventories for this food item.
     */
    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }
}
