<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Resource Model
 *
 * @property int $id
 * @property string $title
 * @property string $description
 * @property string|null $url
 * @property string $category
 * @property string $type
 * @property array|null $tags
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Resource extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'url',
        'category',
        'type',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
    ];

    /**
     * Query Scopes
     */
    public function scopeByCategory(Builder $query, string $category): Builder
    {
        return $query->where('category', $category);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeWithTag(Builder $query, string $tag): Builder
    {
        return $query->whereJsonContains('tags', $tag);
    }
}
