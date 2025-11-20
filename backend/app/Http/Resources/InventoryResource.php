<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InventoryResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'food_item_id' => $this->food_item_id,
            'food_item' => $this->whenLoaded('foodItem', function() {
                return new FoodItemResource($this->foodItem);
            }),
            'item_name' => $this->item_name,
            'quantity' => (float) $this->quantity,
            'unit' => $this->unit,
            'category' => $this->category,
            'purchase_date' => $this->purchase_date?->format('Y-m-d'),
            'expiration_date' => $this->expiration_date?->format('Y-m-d'),
            'is_expiring' => $this->is_expiring,
            'is_expired' => $this->is_expired,
            'days_until_expiration' => $this->days_until_expiration,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
