<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
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
            'full_name' => 'sometimes|string|max:255',
            'household_size' => 'sometimes|integer|min:1',
            'dietary_preferences' => 'sometimes',
            'budget_range' => 'sometimes|string|in:low,medium,high',
            'location' => 'sometimes|string|max:255',
            'profile_image' => 'sometimes|image|mimes:jpeg,jpg,png,gif|max:2048',
        ];
    }

    protected function prepareForValidation()
    {
        // Decode dietary_preferences if it's a JSON string
        if ($this->has('dietary_preferences') && is_string($this->dietary_preferences)) {
            $this->merge([
                'dietary_preferences' => json_decode($this->dietary_preferences, true),
            ]);
        }
    }
}
