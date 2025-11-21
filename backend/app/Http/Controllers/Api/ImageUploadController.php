<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ImageUploadResource;
use App\Models\ImageUpload;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ImageUploadController extends Controller
{
    use ApiResponse;

    /**
     * Upload an image
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function upload(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:5120',
            'upload_type' => 'required|in:receipt,food_label,other',
            'related_inventory_id' => 'nullable|exists:inventories,id',
            'related_log_id' => 'nullable|exists:consumption_logs,id',
        ]);

        $file = $request->file('image');
        $fileName = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $filePath = $file->storeAs('uploads/images', $fileName, 'public');

        $imageUpload = $request->user()->imageUploads()->create([
            'file_path' => Storage::url($filePath),
            'file_name' => $file->getClientOriginalName(),
            'file_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'upload_type' => $validated['upload_type'],
            'related_inventory_id' => $validated['related_inventory_id'] ?? null,
            'related_log_id' => $validated['related_log_id'] ?? null,
        ]);

        return $this->createdResponse(
            new ImageUploadResource($imageUpload),
            'Image uploaded successfully'
        );
    }

    /**
     * Get user's uploaded images
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->per_page ?? config('food_management.pagination.default', 15);
        
        $images = $request->user()->imageUploads()
            ->latest()
            ->paginate($perPage);

        return $this->paginatedResponse(
            $images->through(fn($image) => new ImageUploadResource($image)),
            'Images retrieved successfully'
        );
    }
}
