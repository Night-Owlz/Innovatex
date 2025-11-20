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
        $rules = [
            'full_name' => 'sometimes|string|max:255',
            'household_size' => 'sometimes|integer|min:1',
            'dietary_preferences' => 'sometimes',
            'budget_range' => 'sometimes|string|in:low,medium,high',
            'location' => 'sometimes|string|max:255',
        ];

        // Only apply file validation if profile_image is actually present and is a file
        if ($this->hasFile('profile_image')) {
            $rules['profile_image'] = 'file|image|mimes:jpeg,jpg,png,gif,webp|max:2048';
        }

        return $rules;
    }

    protected function prepareForValidation()
    {
        // Decode dietary_preferences if it's a JSON string
        if ($this->has('dietary_preferences') && is_string($this->dietary_preferences)) {
            $this->merge([
                'dietary_preferences' => json_decode($this->dietary_preferences, true),
            ]);
        }
        
        // Remove _method from validation data
        if ($this->has('_method')) {
            $this->request->remove('_method');
        }
    }
}
