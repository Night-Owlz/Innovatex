<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreInventoryRequest extends FormRequest
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
            'food_item_id' => 'nullable|exists:food_items,id',
            'item_name' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'category' => 'required|string|max:100',
            'purchase_date' => 'required|date',
            'expiration_date' => 'nullable|date|after:purchase_date',
        ];
    }
}
