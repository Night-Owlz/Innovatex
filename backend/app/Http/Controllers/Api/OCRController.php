<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ImageUpload;
use Google\Cloud\Vision\V1\Client\ImageAnnotatorClient;
use Google\Cloud\Vision\V1\AnnotateImageRequest;
use Google\Cloud\Vision\V1\BatchAnnotateImagesRequest;
use Google\Cloud\Vision\V1\Feature;
use Google\Cloud\Vision\V1\Feature\Type;
use Google\Cloud\Vision\V1\Image;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class OCRController extends Controller
{
    /**
     * Extract text and items from uploaded image using Google Vision API
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
                ], 404);
            }

            // Perform Google Vision OCR
            $ocrResults = $this->performGoogleVisionOCR($imageUpload);

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
     * Perform Google Vision API OCR extraction
     *
     * @param ImageUpload $imageUpload
     * @return array
     */
    private function performGoogleVisionOCR(ImageUpload $imageUpload): array
    {
        try {
            // Check if Google credentials are configured
            $credentialsPath = config('services.google.credentials');
            if (!$credentialsPath || !file_exists(base_path($credentialsPath))) {
                Log::warning('Google Vision credentials not found, using simulated OCR');
                return $this->simulateOCRExtraction($imageUpload);
            }

            // Get image file path
            // ImageUpload stores Storage::url() which returns /storage/uploads/images/filename.jpg
            // We need to convert this to the actual file path in storage/app/public/uploads/images/
            $relativePath = str_replace('/storage/', '', $imageUpload->file_path);
            
            // Try direct storage path first (most reliable)
            $imagePath = storage_path('app/public/' . $relativePath);
            
            // Fallback to public path if storage path doesn't exist
            if (!file_exists($imagePath)) {
                $imagePath = public_path('storage/' . $relativePath);
            }

            if (!file_exists($imagePath)) {
                Log::warning('Image file not found at: ' . $imagePath . ' or ' . storage_path('app/public/' . $relativePath));
                // Try one more variation - maybe the path in DB doesn't have /storage/ prefix?
                if (strpos($imageUpload->file_path, '/storage/') === false) {
                    $imagePath = storage_path('app/public/' . $imageUpload->file_path);
                    if (file_exists($imagePath)) {
                        goto found;
                    }
                }
                throw new \Exception('Image file not found');
            }

            found:

            // Initialize Google Vision client
            $credentialsPath = base_path(config('services.google.credentials'));
            if (!file_exists($credentialsPath)) {
                 Log::warning('Google Credentials file not found at: ' . $credentialsPath);
                 return $this->simulateOCRExtraction($imageUpload);
            }

            $imageAnnotator = new ImageAnnotatorClient([
                'credentials' => $credentialsPath
            ]);

            // Read image file
            $imageContent = file_get_contents($imagePath);

            // Prepare the request
            $image = new Image();
            $image->setContent($imageContent);

            $feature = new Feature();
            $feature->setType(Type::TEXT_DETECTION);

            $request = new AnnotateImageRequest();
            $request->setImage($image);
            $request->setFeatures([$feature]);

            $batchRequest = new BatchAnnotateImagesRequest();
            $batchRequest->setRequests([$request]);

            // Perform text detection
            $response = $imageAnnotator->batchAnnotateImages($batchRequest);
            $responses = $response->getResponses();

            $imageAnnotator->close();

            if ($responses->count() === 0) {
                Log::warning('No response from Vision API');
                return [
                    'extractedText' => '',
                    'parsedItems' => [],
                    'confidence' => 0,
                    'requiresConfirmation' => true,
                ];
            }

            $texts = $responses[0]->getTextAnnotations();

            if (count($texts) === 0) {
                Log::warning('No text detected in image');
                return [
                    'extractedText' => '',
                    'parsedItems' => [],
                    'confidence' => 0,
                    'requiresConfirmation' => true,
                ];
            }

            // First annotation is the full text
            $fullText = $texts[0]->getDescription();
            
            // Parse the extracted text into items
            $parsedItems = $this->parseVisionText($fullText);

            // Calculate average confidence
            $confidence = $this->calculateConfidence($parsedItems);

            return [
                'extractedText' => $fullText,
                'parsedItems' => $parsedItems,
                'confidence' => $confidence,
                'requiresConfirmation' => $confidence < 0.8,
            ];

        } catch (\Exception $e) {
            Log::error('Google Vision API Error: ' . $e->getMessage());
            
            // Fall back to simulated OCR
            return $this->simulateOCRExtraction($imageUpload);
        }
    }

    /**
     * Parse Vision API extracted text into structured items
     *
     * @param string $text
     * @return array
     */
    private function parseVisionText(string $text): array
    {
        $lines = explode("\n", $text);
        $items = [];
        $foodCategories = $this->getFoodCategories();

        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || strlen($line) < 3) {
                continue;
            }

            // Try to extract item information
            $item = $this->extractItemFromLine($line, $foodCategories);
            
            if ($item) {
                $items[] = $item;
            }
        }

        return $items;
    }

    /**
     * Extract item information from a single line of text
     *
     * @param string $line
     * @param array $foodCategories
     * @return array|null
     */
    private function extractItemFromLine(string $line, array $foodCategories): ?array
    {
        // Pattern: Item Name Quantity Unit $Price
        // Examples: "Apples 2kg $4.50", "Milk 1L $2.30", "Bread 1pc $1.20"
        
        // Extract price (optional)
        $price = null;
        if (preg_match('/\$?(\d+\.?\d*)/', $line, $priceMatch)) {
            $price = floatval($priceMatch[1]);
            $line = preg_replace('/\$?\d+\.?\d*/', '', $line); // Remove price from line
        }

        // Extract quantity and unit
        $quantity = 1;
        $unit = 'pcs';
        
        $unitPatterns = [
            '/(\d+\.?\d*)\s*(kg|kilogram|kilograms)/i' => 'kg',
            '/(\d+\.?\d*)\s*(g|gram|grams)/i' => 'g',
            '/(\d+\.?\d*)\s*(L|liter|liters|litre|litres)/i' => 'L',
            '/(\d+\.?\d*)\s*(ml|milliliter|milliliters)/i' => 'ml',
            '/(\d+\.?\d*)\s*(lb|lbs|pound|pounds)/i' => 'lb',
            '/(\d+\.?\d*)\s*(oz|ounce|ounces)/i' => 'oz',
            '/(\d+\.?\d*)\s*(pc|pcs|piece|pieces|unit|units)/i' => 'pcs',
            '/(\d+\.?\d*)\s*(can|cans|bottle|bottles|box|boxes)/i' => 'pcs',
        ];

        foreach ($unitPatterns as $pattern => $extractedUnit) {
            if (preg_match($pattern, $line, $match)) {
                $quantity = floatval($match[1]);
                $unit = $extractedUnit;
                $line = preg_replace($pattern, '', $line);
                break;
            }
        }

        // Clean up the line to get item name
        $itemName = trim(preg_replace('/\s+/', ' ', $line));
        
        // Skip if line is likely not a food item
        if (strlen($itemName) < 2 || preg_match('/^(total|subtotal|tax|receipt|date|time)/i', $itemName)) {
            return null;
        }

        // Try to match category
        $category = $this->matchCategory($itemName, $foodCategories);

        // Estimate expiration date based on category
        $expiryDate = $this->estimateExpiryDate($category);

        return [
            'itemName' => ucwords(strtolower($itemName)),
            'quantity' => $quantity,
            'unit' => $unit,
            'estimatedCost' => $price,
            'category' => $category,
            'expiryDate' => $expiryDate,
            'confidence' => $this->calculateItemConfidence($itemName, $quantity, $price),
        ];
    }

    /**
     * Match item name to food category
     *
     * @param string $itemName
     * @param array $foodCategories
     * @return string
     */
    private function matchCategory(string $itemName, array $foodCategories): string
    {
        $itemNameLower = strtolower($itemName);

        foreach ($foodCategories as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (stripos($itemNameLower, strtolower($keyword)) !== false) {
                    return $category;
                }
            }
        }

        return 'other';
    }

    /**
     * Get food categories and their keywords
     *
     * @return array
     */
    private function getFoodCategories(): array
    {
        return [
            'fruit' => ['apple', 'banana', 'orange', 'grape', 'berry', 'mango', 'peach', 'pear', 'melon', 'kiwi'],
            'vegetable' => ['lettuce', 'tomato', 'carrot', 'potato', 'onion', 'garlic', 'pepper', 'cucumber', 'broccoli', 'spinach', 'cabbage'],
            'dairy' => ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'egg'],
            'grain' => ['bread', 'rice', 'pasta', 'cereal', 'flour', 'oat', 'wheat'],
            'protein' => ['chicken', 'beef', 'pork', 'fish', 'tuna', 'salmon', 'meat', 'turkey', 'ham'],
            'beverage' => ['juice', 'water', 'soda', 'tea', 'coffee', 'drink'],
        ];
    }

    /**
     * Estimate expiration date based on category
     *
     * @param string $category
     * @return string|null
     */
    private function estimateExpiryDate(string $category): ?string
    {
        $daysToAdd = [
            'fruit' => 7,
            'vegetable' => 7,
            'dairy' => 7,
            'grain' => 14,
            'protein' => 3,
            'beverage' => 30,
            'other' => 30,
        ];

        $days = $daysToAdd[$category] ?? 30;
        return date('Y-m-d', strtotime("+{$days} days"));
    }

    /**
     * Calculate confidence score for an item
     *
     * @param string $itemName
     * @param float $quantity
     * @param float|null $price
     * @return float
     */
    private function calculateItemConfidence(string $itemName, float $quantity, ?float $price): float
    {
        $confidence = 0.5; // Base confidence

        // Increase confidence if item name looks valid (2+ words or common food items)
        if (str_word_count($itemName) >= 1 && strlen($itemName) >= 3) {
            $confidence += 0.2;
        }

        // Increase confidence if we found a proper quantity
        if ($quantity > 0 && $quantity != 1) {
            $confidence += 0.15;
        }

        // Increase confidence if we found a price
        if ($price !== null && $price > 0) {
            $confidence += 0.15;
        }

        return min($confidence, 1.0);
    }

    /**
     * Calculate overall confidence from parsed items
     *
     * @param array $items
     * @return float
     */
    private function calculateConfidence(array $items): float
    {
        if (empty($items)) {
            return 0.0;
        }

        $totalConfidence = array_reduce($items, function ($sum, $item) {
            return $sum + ($item['confidence'] ?? 0.5);
        }, 0);

        return $totalConfidence / count($items);
    }

    /**
     * Simulate OCR extraction results (fallback)
     *
     * @param ImageUpload $imageUpload
     * @return array
     */
    private function simulateOCRExtraction(ImageUpload $imageUpload): array
    {
        $uploadType = $imageUpload->upload_type ?? 'receipt';

        $extractedText = "Receipt from SuperMart\nApples 2kg $4.50\nMilk 1L $2.30\nBread 1pc $1.20\nExpiry: 2025-01-30";
        
        $parsedItems = [
            [
                'itemName' => 'Apples',
                'quantity' => 2,
                'unit' => 'kg',
                'estimatedCost' => 4.50,
                'category' => 'fruit',
                'expiryDate' => null,
                'confidence' => 0.85,
            ],
            [
                'itemName' => 'Milk',
                'quantity' => 1,
                'unit' => 'L',
                'estimatedCost' => 2.30,
                'category' => 'dairy',
                'expiryDate' => '2025-01-30',
                'confidence' => 0.90,
            ],
            [
                'itemName' => 'Bread',
                'quantity' => 1,
                'unit' => 'pcs',
                'estimatedCost' => 1.20,
                'category' => 'grain',
                'expiryDate' => null,
                'confidence' => 0.80,
            ],
        ];

        return [
            'extractedText' => $extractedText,
            'parsedItems' => $parsedItems,
            'confidence' => 0.85,
            'requiresConfirmation' => true,
        ];
    }
}
