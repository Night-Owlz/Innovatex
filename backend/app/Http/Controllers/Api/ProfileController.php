<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ProfileController extends Controller
{
    use ApiResponse;

    /**
     * Get user profile
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function show(Request $request): JsonResponse
    {
        return $this->successResponse(
            new UserResource($request->user()),
            'Profile retrieved successfully'
        );
    }

    /**
     * Update user profile
     *
     * @param UpdateProfileRequest $request
     * @return JsonResponse
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        Log::info('Profile update request received', [
            'has_file' => $request->hasFile('profile_image'),
            'all_data' => $request->all(),
        ]);

        $user = $request->user();
        $data = $request->validated();

        Log::info('Validated data', ['data' => $data]);

        // Handle profile image upload
        if ($request->hasFile('profile_image')) {
            Log::info('Processing profile image upload');
            $image = $request->file('profile_image');
            $filename = time() . '_' . $user->id . '.' . $image->getClientOriginalExtension();
            $path = $image->storeAs('profile-images', $filename, 'public');
            $data['profile_image'] = '/storage/' . $path;

            Log::info('Image stored', ['path' => $data['profile_image']]);

            // Delete old profile image if exists
            if ($user->profile_image && file_exists(public_path($user->profile_image))) {
                @unlink(public_path($user->profile_image));
            }
        }

        $user->update($data);
        
        Log::info('Profile updated successfully', ['user_id' => $user->id]);

        return $this->updatedResponse(
            new UserResource($user->fresh()),
            'Profile updated successfully'
        );
    }
}
