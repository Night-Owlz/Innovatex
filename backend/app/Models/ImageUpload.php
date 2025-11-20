<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * ImageUpload Model
 *
 * @property int $id
 * @property int $user_id
 * @property string $file_path
 * @property string $file_name
 * @property string $file_type
 * @property int $file_size
 * @property string $upload_type
 * @property int|null $related_inventory_id
 * @property int|null $related_log_id
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read User $user
 * @property-read Inventory|null $inventory
 * @property-read ConsumptionLog|null $consumptionLog
 */
class ImageUpload extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'file_path',
        'file_name',
        'file_type',
        'file_size',
        'upload_type',
        'related_inventory_id',
        'related_log_id',
    ];

    protected $casts = [
        'file_size' => 'integer',
    ];

    /**
     * Get the user that owns the image.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the inventory this image is related to.
     */
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(Inventory::class, 'related_inventory_id');
    }

    /**
     * Get the consumption log this image is related to.
     */
    public function consumptionLog(): BelongsTo
    {
        return $this->belongsTo(ConsumptionLog::class, 'related_log_id');
    }
}
