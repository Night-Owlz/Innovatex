<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'food_item_id' => 'sometimes|nullable|exists:food_items,id',
            'item_name' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|numeric|min:0',
            'unit' => 'sometimes|string|max:50',
            'category' => 'sometimes|string|max:100',
            'purchase_date' => 'sometimes|date',
            'expiration_date' => 'sometimes|nullable|date',
        ];
    }
}
