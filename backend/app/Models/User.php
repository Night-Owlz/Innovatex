<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * User Model
 *
 * @property int $id
 * @property string $full_name
 * @property string $email
 * @property string $password
 * @property int $household_size
 * @property array|null $dietary_preferences
 * @property string|null $budget_range
 * @property string|null $location
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection<ConsumptionLog> $consumptionLogs
 * @property-read \Illuminate\Database\Eloquent\Collection<Inventory> $inventories
 * @property-read \Illuminate\Database\Eloquent\Collection<ImageUpload> $imageUploads
 */
class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'full_name',
        'email',
        'password',
        'household_size',
        'dietary_preferences',
        'budget_range',
        'location',
        'profile_image',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'dietary_preferences' => 'array',
    ];

    /**
     * Get the consumption logs for the user.
     */
    public function consumptionLogs(): HasMany
    {
        return $this->hasMany(ConsumptionLog::class);
    }

    /**
     * Get the inventories for the user.
     */
    public function inventories(): HasMany
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * Get the image uploads for the user.
     */
    public function imageUploads(): HasMany
    {
        return $this->hasMany(ImageUpload::class);
    }
}
