<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ImageUpload;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class OCRController extends Controller
{
    /**
     * Extract text and items from uploaded image using OCR
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function extractFromImage(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'imageId' => 'required|integer|exists:image_uploads,id',
            ]);

            $user = $request->user();
            $imageId = $validated['imageId'];

            // Get ImageUpload record and verify ownership
            $imageUpload = ImageUpload::find($imageId);

            if (!$imageUpload) {
                return response()->json([
                    'message' => 'Image not found',
                ], 404);
            }

            // Verify image belongs to authenticated user
            if ($imageUpload->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Unauthorized access to this image',
                ], 404); // Use 404 instead of 403 to not reveal existence
            }

            // Simulated OCR results
            // TODO: Replace with real OCR service integration (e.g., Tesseract, Google Vision API, AWS Textract)
            $ocrResults = $this->simulateOCRExtraction($imageUpload);

            return response()->json([
                'message' => 'OCR extraction completed successfully',
                'extractedText' => $ocrResults['extractedText'],
                'parsedItems' => $ocrResults['parsedItems'],
                'confidence' => $ocrResults['confidence'],
                'requiresConfirmation' => $ocrResults['requiresConfirmation'],
                'imageId' => $imageUpload->id,
                'fileName' => $imageUpload->file_name,
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('OCR Extraction Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'image_id' => $request->input('imageId'),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to extract data from image',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred during OCR processing',
            ], 500);
        }
    }

    /**
     * Simulate OCR extraction results
     * This will be replaced with real OCR integration
     *
     * @param ImageUpload $imageUpload
     * @return array
     */
    private function simulateOCRExtraction(ImageUpload $imageUpload): array
    {
        // Simulated extraction based on image type
        $uploadType = $imageUpload->upload_type ?? 'receipt';

        $extractedText = "Receipt from SuperMart\nApples 2kg \$4.50\nMilk 1L \$2.30\nBread 1pc \$1.20\nExpiry: 2025-01-30";
        
        $parsedItems = [
            [
                'itemName' => 'Apples',
                'quantity' => 2,
                'unit' => 'kg',
                'estimatedCost' => 4.50,
                'category' => 'fruit',
                'expiryDate' => null,
            ],
            [
                'itemName' => 'Milk',
                'quantity' => 1,
                'unit' => 'L',
                'estimatedCost' => 2.30,
                'category' => 'dairy',
                'expiryDate' => '2025-01-30',
            ],
            [
                'itemName' => 'Bread',
                'quantity' => 1,
                'unit' => 'pcs',
                'estimatedCost' => 1.20,
                'category' => 'grain',
                'expiryDate' => null,
            ],
        ];

        // Vary results slightly based on upload type
        if ($uploadType === 'inventory') {
            $extractedText = "Pantry Inventory\nRice 5kg\nPasta 500g\nTomato Sauce 2 cans\nOlive Oil 750ml\nExpiry dates visible on packaging";
            
            $parsedItems = [
                [
                    'itemName' => 'Rice',
                    'quantity' => 5,
                    'unit' => 'kg',
                    'estimatedCost' => null,
                    'category' => 'grain',
                    'expiryDate' => '2026-03-15',
                ],
                [
                    'itemName' => 'Pasta',
                    'quantity' => 500,
                    'unit' => 'g',
                    'estimatedCost' => null,
                    'category' => 'grain',
                    'expiryDate' => '2025-12-20',
                ],
                [
                    'itemName' => 'Tomato Sauce',
                    'quantity' => 2,
                    'unit' => 'cans',
                    'estimatedCost' => null,
                    'category' => 'other',
                    'expiryDate' => '2026-01-10',
                ],
                [
                    'itemName' => 'Olive Oil',
                    'quantity' => 750,
                    'unit' => 'ml',
                    'estimatedCost' => null,
                    'category' => 'other',
                    'expiryDate' => '2025-11-30',
                ],
            ];
        }

        return [
            'extractedText' => $extractedText,
            'parsedItems' => $parsedItems,
            'confidence' => 0.85,
            'requiresConfirmation' => true,
            'processingMethod' => 'simulated', // Indicates this is simulated data
        ];
    }

    /**
     * Real OCR implementation placeholder
     * Integrate with OCR service (Tesseract, Google Vision, AWS Textract, etc.)
     *
     * @param ImageUpload $imageUpload
     * @return array
     */
    private function performRealOCR(ImageUpload $imageUpload): array
    {
        // TODO: Implement real OCR service integration
        // Example using Google Vision API:
        /*
        $client = new VisionClient(['keyFile' => config('services.google.vision_key')]);
        $image = $client->image(file_get_contents(storage_path($imageUpload->file_path)), ['TEXT_DETECTION']);
        $annotation = $client->annotate($image);
        $text = $annotation->text();
        
        // Parse text and extract items
        $parsedItems = $this->parseExtractedText($text);
        
        return [
            'extractedText' => $text,
            'parsedItems' => $parsedItems,
            'confidence' => $annotation->confidence(),
            'requiresConfirmation' => true,
        ];
        */

        throw new \Exception('Real OCR not yet implemented');
    }

    /**
     * Parse extracted text to identify items
     *
     * @param string $text
     * @return array
     */
    private function parseExtractedText(string $text): array
    {
        // TODO: Implement intelligent parsing
        // Use regex patterns, NLP, or ML to identify:
        // - Item names
        // - Quantities and units
        // - Prices
        // - Expiry dates
        // - Categories

        return [];
    }
}
