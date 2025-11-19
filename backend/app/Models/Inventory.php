<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'food_item_id',
        'item_name',
        'quantity',
        'unit',
        'category',
        'purchase_date',
        'expiration_date',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'expiration_date' => 'date',
    ];

    /**
     * Relationships
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function foodItem()
    {
        return $this->belongsTo(FoodItem::class);
    }

    public function imageUploads()
    {
        return $this->hasMany(ImageUpload::class, 'related_inventory_id');
    }

    /**
     * Query Scopes
     */
    public function scopeExpiringSoon(Builder $query, int $days = 7): Builder
    {
        return $query->whereNotNull('expiration_date')
            ->whereDate('expiration_date', '<=', Carbon::now()->addDays($days))
            ->whereDate('expiration_date', '>=', Carbon::now());
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->whereNotNull('expiration_date')
            ->whereDate('expiration_date', '<', Carbon::now());
    }

    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeLowStock(Builder $query, float $threshold = 1.0): Builder
    {
        return $query->where('quantity', '<=', $threshold);
    }

    /**
     * Accessors & Mutators
     */
    public function getIsExpiringAttribute(): bool
    {
        if (!$this->expiration_date) {
            return false;
        }

        return $this->expiration_date->lte(Carbon::now()->addDays(7)) 
            && $this->expiration_date->gte(Carbon::now());
    }

    public function getIsExpiredAttribute(): bool
    {
        if (!$this->expiration_date) {
            return false;
        }

        return $this->expiration_date->lt(Carbon::now());
    }

    public function getDaysUntilExpirationAttribute(): ?int
    {
        if (!$this->expiration_date) {
            return null;
        }

        return Carbon::now()->diffInDays($this->expiration_date, false);
    }
}
