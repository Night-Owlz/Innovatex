<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\MealPlan;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class MealPlannerController extends Controller
{
    /**
     * Optimize meal plan based on inventory, budget, and dietary preferences
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function optimizeMealPlan(Request $request): JsonResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'weekStartDate' => 'required|date',
                'customPreferences' => 'nullable|string|max:500',
            ]);

            $user = $request->user();
            $weekStartDate = Carbon::parse($validated['weekStartDate'])->startOfDay();
            $customPreferences = $validated['customPreferences'] ?? null;

            // Get user's budget range and convert to weekly budget
            $weeklyBudget = $this->convertBudgetRange($user->budget_range);

            // Fetch user's current inventory sorted by expiration date (FIFO)
            $inventory = Inventory::where('user_id', $user->id)
                ->orderByRaw('CASE WHEN expiration_date IS NULL THEN 1 ELSE 0 END')
                ->orderBy('expiration_date', 'asc')
                ->get();

            // Get dietary preferences
            $dietaryPreferences = $user->dietary_preferences ?? [];
            if (!is_array($dietaryPreferences)) {
                $dietaryPreferences = [];
            }

            // Generate meal plan
            $mealPlanData = $this->generateWeeklyMealPlan(
                $inventory,
                $dietaryPreferences,
                $weeklyBudget,
                $customPreferences
            );

            // Generate shopping list
            $shoppingList = $this->generateShoppingList($mealPlanData['meals']);

            // Calculate total cost
            $totalCost = $this->calculateTotalCost($shoppingList);

            // Calculate budget remaining
            $budgetRemaining = max(0, $weeklyBudget - $totalCost);

            // Calculate nutrition summary
            $nutritionSummary = $this->calculateNutritionSummary($mealPlanData['meals']);

            // Save meal plan to database
            $mealPlan = MealPlan::updateOrCreate(
                [
                    'user_id' => $user->id,
                    'week_start_date' => $weekStartDate,
                ],
                [
                    'plan_data' => $mealPlanData['meals'],
                    'shopping_list' => $shoppingList,
                    'total_cost' => $totalCost,
                ]
            );

            return response()->json([
                'message' => 'Meal plan optimized successfully',
                'mealPlan' => $mealPlanData['meals'],
                'shoppingList' => $shoppingList,
                'totalCost' => round($totalCost, 2),
                'weeklyBudget' => $weeklyBudget,
                'budgetRemaining' => round($budgetRemaining, 2),
                'nutritionSummary' => $nutritionSummary,
                'weekStartDate' => $weekStartDate->toDateString(),
                'inventoryItemsUsed' => $mealPlanData['inventoryUsed'],
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Meal Plan Optimization Error: ' . $e->getMessage(), [
                'user_id' => $request->user()->id ?? null,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to optimize meal plan',
                'error' => config('app.debug') ? $e->getMessage() : 'An error occurred during meal planning',
            ], 500);
        }
    }

    /**
     * Convert budget range to weekly budget amount
     *
     * @param string|null $budgetRange
     * @return float
     */
    private function convertBudgetRange(?string $budgetRange): float
    {
        $budgetMap = [
            'low' => 200,
            'medium' => 400,
            'high' => 600,
        ];

        return $budgetMap[strtolower($budgetRange ?? 'medium')] ?? 400;
    }

    /**
     * Generate weekly meal plan
     *
     * @param \Illuminate\Support\Collection $inventory
     * @param array $dietaryPreferences
     * @param float $weeklyBudget
     * @param string|null $customPreferences
     * @return array
     */
    private function generateWeeklyMealPlan($inventory, array $dietaryPreferences, float $weeklyBudget, ?string $customPreferences): array
    {
        $daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $mealTypes = ['breakfast', 'lunch', 'dinner'];
        $meals = [];
        $inventoryUsed = [];

        // Track inventory usage
        $inventoryTracker = $inventory->mapWithKeys(function ($item) {
            return [$item->id => [
                'item_name' => $item->item_name,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'category' => $item->category,
                'expiration_date' => $item->expiration_date,
                'used' => 0,
            ]];
        })->toArray();

        foreach ($daysOfWeek as $dayIndex => $day) {
            foreach ($mealTypes as $mealType) {
                $meal = $this->generateMeal(
                    $day,
                    $mealType,
                    $inventoryTracker,
                    $dietaryPreferences,
                    $dayIndex
                );
                
                $meals[] = $meal;

                // Update inventory tracker
                foreach ($meal['ingredients'] as $ingredient) {
                    if ($ingredient['source'] === 'inventory' && isset($ingredient['inventoryId'])) {
                        $inventoryTracker[$ingredient['inventoryId']]['used'] += $ingredient['quantity'];
                    }
                }
            }
        }

        // Collect inventory items used
        foreach ($inventoryTracker as $id => $item) {
            if ($item['used'] > 0) {
                $inventoryUsed[] = [
                    'item_name' => $item['item_name'],
                    'quantity_used' => $item['used'],
                    'unit' => $item['unit'],
                    'total_available' => $item['quantity'],
                    'expiration_date' => $item['expiration_date'] ? $item['expiration_date']->toDateString() : null,
                ];
            }
        }

        return [
            'meals' => $meals,
            'inventoryUsed' => $inventoryUsed,
        ];
    }

    /**
     * Generate a single meal
     *
     * @param string $day
     * @param string $mealType
     * @param array &$inventoryTracker
     * @param array $dietaryPreferences
     * @param int $dayIndex
     * @return array
     */
    private function generateMeal(string $day, string $mealType, array &$inventoryTracker, array $dietaryPreferences, int $dayIndex): array
    {
        $isVegetarian = in_array('vegetarian', array_map('strtolower', $dietaryPreferences));
        $isVegan = in_array('vegan', array_map('strtolower', $dietaryPreferences));

        // Meal templates based on type
        $mealTemplates = $this->getMealTemplates($mealType, $isVegetarian, $isVegan);
        
        // Select meal template (rotate through days)
        $templateIndex = ($dayIndex * 3 + array_search($mealType, ['breakfast', 'lunch', 'dinner'])) % count($mealTemplates);
        $selectedTemplate = $mealTemplates[$templateIndex];

        // Build ingredients, prioritizing inventory
        $ingredients = [];
        foreach ($selectedTemplate['ingredients'] as $ingredientTemplate) {
            $ingredient = $this->findIngredient(
                $ingredientTemplate,
                $inventoryTracker
            );
            $ingredients[] = $ingredient;
        }

        return [
            'day' => $day,
            'mealType' => $mealType,
            'dishName' => $selectedTemplate['dishName'],
            'ingredients' => $ingredients,
            'servings' => $selectedTemplate['servings'] ?? 2,
            'estimatedPrepTime' => $selectedTemplate['prepTime'] ?? '30 minutes',
        ];
    }

    /**
     * Get meal templates based on meal type and dietary preferences
     *
     * @param string $mealType
     * @param bool $isVegetarian
     * @param bool $isVegan
     * @return array
     */
    private function getMealTemplates(string $mealType, bool $isVegetarian, bool $isVegan): array
    {
        if ($mealType === 'breakfast') {
            return [
                [
                    'dishName' => 'Oatmeal with Fresh Fruits',
                    'servings' => 2,
                    'prepTime' => '15 minutes',
                    'ingredients' => [
                        ['name' => 'Oats', 'quantity' => 1, 'unit' => 'cup', 'category' => 'grain'],
                        ['name' => 'Banana', 'quantity' => 2, 'unit' => 'pcs', 'category' => 'fruit'],
                        ['name' => 'Milk', 'quantity' => 0.5, 'unit' => 'L', 'category' => 'dairy'],
                    ],
                ],
                [
                    'dishName' => $isVegan ? 'Avocado Toast' : 'Scrambled Eggs with Toast',
                    'servings' => 2,
                    'prepTime' => '20 minutes',
                    'ingredients' => $isVegan ? [
                        ['name' => 'Bread', 'quantity' => 4, 'unit' => 'slices', 'category' => 'grain'],
                        ['name' => 'Avocado', 'quantity' => 1, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Tomato', 'quantity' => 1, 'unit' => 'pcs', 'category' => 'vegetable'],
                    ] : [
                        ['name' => 'Eggs', 'quantity' => 4, 'unit' => 'pcs', 'category' => 'protein'],
                        ['name' => 'Bread', 'quantity' => 4, 'unit' => 'slices', 'category' => 'grain'],
                        ['name' => 'Butter', 'quantity' => 0.05, 'unit' => 'kg', 'category' => 'dairy'],
                    ],
                ],
                [
                    'dishName' => 'Greek Yogurt with Granola',
                    'servings' => 2,
                    'prepTime' => '10 minutes',
                    'ingredients' => [
                        ['name' => 'Greek Yogurt', 'quantity' => 0.5, 'unit' => 'kg', 'category' => 'dairy'],
                        ['name' => 'Granola', 'quantity' => 0.2, 'unit' => 'kg', 'category' => 'grain'],
                        ['name' => 'Berries', 'quantity' => 0.2, 'unit' => 'kg', 'category' => 'fruit'],
                    ],
                ],
            ];
        }

        if ($mealType === 'lunch') {
            $templates = [
                [
                    'dishName' => 'Fresh Garden Salad',
                    'servings' => 2,
                    'prepTime' => '20 minutes',
                    'ingredients' => [
                        ['name' => 'Lettuce', 'quantity' => 0.3, 'unit' => 'kg', 'category' => 'vegetable'],
                        ['name' => 'Tomato', 'quantity' => 2, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Cucumber', 'quantity' => 1, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Olive Oil', 'quantity' => 0.05, 'unit' => 'L', 'category' => 'other'],
                    ],
                ],
                [
                    'dishName' => 'Vegetable Soup',
                    'servings' => 2,
                    'prepTime' => '40 minutes',
                    'ingredients' => [
                        ['name' => 'Carrot', 'quantity' => 0.3, 'unit' => 'kg', 'category' => 'vegetable'],
                        ['name' => 'Potato', 'quantity' => 0.4, 'unit' => 'kg', 'category' => 'vegetable'],
                        ['name' => 'Onion', 'quantity' => 1, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Vegetable Broth', 'quantity' => 1, 'unit' => 'L', 'category' => 'other'],
                    ],
                ],
                [
                    'dishName' => 'Pasta with Tomato Sauce',
                    'servings' => 2,
                    'prepTime' => '25 minutes',
                    'ingredients' => [
                        ['name' => 'Pasta', 'quantity' => 0.3, 'unit' => 'kg', 'category' => 'grain'],
                        ['name' => 'Tomato Sauce', 'quantity' => 0.4, 'unit' => 'L', 'category' => 'other'],
                        ['name' => 'Garlic', 'quantity' => 3, 'unit' => 'cloves', 'category' => 'vegetable'],
                        ['name' => 'Basil', 'quantity' => 0.02, 'unit' => 'kg', 'category' => 'vegetable'],
                    ],
                ],
            ];

            if (!$isVegetarian && !$isVegan) {
                $templates[] = [
                    'dishName' => 'Grilled Chicken Salad',
                    'servings' => 2,
                    'prepTime' => '30 minutes',
                    'ingredients' => [
                        ['name' => 'Chicken Breast', 'quantity' => 0.4, 'unit' => 'kg', 'category' => 'protein'],
                        ['name' => 'Lettuce', 'quantity' => 0.3, 'unit' => 'kg', 'category' => 'vegetable'],
                        ['name' => 'Tomato', 'quantity' => 2, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Olive Oil', 'quantity' => 0.05, 'unit' => 'L', 'category' => 'other'],
                    ],
                ];
            }

            return $templates;
        }

        if ($mealType === 'dinner') {
            $templates = [
                [
                    'dishName' => 'Stir-Fry Vegetables with Rice',
                    'servings' => 2,
                    'prepTime' => '35 minutes',
                    'ingredients' => [
                        ['name' => 'Rice', 'quantity' => 0.3, 'unit' => 'kg', 'category' => 'grain'],
                        ['name' => 'Bell Pepper', 'quantity' => 2, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Broccoli', 'quantity' => 0.3, 'unit' => 'kg', 'category' => 'vegetable'],
                        ['name' => 'Soy Sauce', 'quantity' => 0.05, 'unit' => 'L', 'category' => 'other'],
                    ],
                ],
                [
                    'dishName' => 'Bean Curry with Bread',
                    'servings' => 2,
                    'prepTime' => '45 minutes',
                    'ingredients' => [
                        ['name' => 'Kidney Beans', 'quantity' => 0.4, 'unit' => 'kg', 'category' => 'protein'],
                        ['name' => 'Tomato', 'quantity' => 3, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Onion', 'quantity' => 2, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Bread', 'quantity' => 4, 'unit' => 'slices', 'category' => 'grain'],
                    ],
                ],
                [
                    'dishName' => 'Vegetable Pasta Bake',
                    'servings' => 2,
                    'prepTime' => '50 minutes',
                    'ingredients' => [
                        ['name' => 'Pasta', 'quantity' => 0.3, 'unit' => 'kg', 'category' => 'grain'],
                        ['name' => 'Zucchini', 'quantity' => 2, 'unit' => 'pcs', 'category' => 'vegetable'],
                        ['name' => 'Tomato Sauce', 'quantity' => 0.5, 'unit' => 'L', 'category' => 'other'],
                        ['name' => 'Cheese', 'quantity' => 0.2, 'unit' => 'kg', 'category' => 'dairy'],
                    ],
                ],
            ];

            if (!$isVegetarian && !$isVegan) {
                $templates[] = [
                    'dishName' => 'Baked Fish with Roasted Potatoes',
                    'servings' => 2,
                    'prepTime' => '45 minutes',
                    'ingredients' => [
                        ['name' => 'Fish Fillet', 'quantity' => 0.4, 'unit' => 'kg', 'category' => 'protein'],
                        ['name' => 'Potato', 'quantity' => 0.6, 'unit' => 'kg', 'category' => 'vegetable'],
                        ['name' => 'Lemon', 'quantity' => 1, 'unit' => 'pcs', 'category' => 'fruit'],
                        ['name' => 'Olive Oil', 'quantity' => 0.05, 'unit' => 'L', 'category' => 'other'],
                    ],
                ];
            }

            return $templates;
        }

        return [];
    }

    /**
     * Find ingredient from inventory or mark for purchase
     *
     * @param array $ingredientTemplate
     * @param array &$inventoryTracker
     * @return array
     */
    private function findIngredient(array $ingredientTemplate, array &$inventoryTracker): array
    {
        $itemName = $ingredientTemplate['name'];
        $requiredQuantity = $ingredientTemplate['quantity'];
        $unit = $ingredientTemplate['unit'];
        $category = $ingredientTemplate['category'];

        // Try to find in inventory (FIFO - already sorted)
        foreach ($inventoryTracker as $id => $inventoryItem) {
            // Match by name or category
            $nameMatch = stripos($inventoryItem['item_name'], $itemName) !== false || 
                         stripos($itemName, $inventoryItem['item_name']) !== false;
            
            if ($nameMatch && $inventoryItem['category'] === $category) {
                $available = $inventoryItem['quantity'] - $inventoryItem['used'];
                
                if ($available >= $requiredQuantity) {
                    return [
                        'item' => $inventoryItem['item_name'],
                        'quantity' => $requiredQuantity,
                        'unit' => $unit,
                        'source' => 'inventory',
                        'inventoryId' => $id,
                        'expirationDate' => $inventoryItem['expiration_date'] ? 
                            $inventoryItem['expiration_date']->toDateString() : null,
                    ];
                }
            }
        }

        // Not in inventory - needs to be purchased
        return [
            'item' => $itemName,
            'quantity' => $requiredQuantity,
            'unit' => $unit,
            'source' => 'purchase',
            'estimatedCost' => $this->estimateItemCost($itemName, $requiredQuantity, $category),
        ];
    }

    /**
     * Estimate cost for an item
     *
     * @param string $itemName
     * @param float $quantity
     * @param string $category
     * @return float
     */
    private function estimateItemCost(string $itemName, float $quantity, string $category): float
    {
        // Simple cost estimation based on category
        $basePrices = [
            'fruit' => 3.00,
            'vegetable' => 2.50,
            'dairy' => 4.00,
            'grain' => 2.00,
            'protein' => 8.00,
            'other' => 3.50,
        ];

        $basePrice = $basePrices[$category] ?? 3.00;
        return round($basePrice * $quantity, 2);
    }

    /**
     * Generate shopping list from meals
     *
     * @param array $meals
     * @return array
     */
    private function generateShoppingList(array $meals): array
    {
        $shoppingList = [];
        $itemsMap = [];

        foreach ($meals as $meal) {
            foreach ($meal['ingredients'] as $ingredient) {
                if ($ingredient['source'] === 'purchase') {
                    $key = strtolower($ingredient['item']);
                    
                    if (!isset($itemsMap[$key])) {
                        $itemsMap[$key] = [
                            'item' => $ingredient['item'],
                            'totalQuantity' => 0,
                            'unit' => $ingredient['unit'],
                            'estimatedCost' => 0,
                        ];
                    }
                    
                    $itemsMap[$key]['totalQuantity'] += $ingredient['quantity'];
                    $itemsMap[$key]['estimatedCost'] += $ingredient['estimatedCost'];
                }
            }
        }

        foreach ($itemsMap as $item) {
            $shoppingList[] = [
                'item' => $item['item'],
                'quantity' => round($item['totalQuantity'], 2),
                'unit' => $item['unit'],
                'estimatedCost' => round($item['estimatedCost'], 2),
            ];
        }

        // Sort by estimated cost (expensive items first)
        usort($shoppingList, function ($a, $b) {
            return $b['estimatedCost'] <=> $a['estimatedCost'];
        });

        return $shoppingList;
    }

    /**
     * Calculate total cost from shopping list
     *
     * @param array $shoppingList
     * @return float
     */
    private function calculateTotalCost(array $shoppingList): float
    {
        $total = 0;
        foreach ($shoppingList as $item) {
            $total += $item['estimatedCost'];
        }
        return $total;
    }

    /**
     * Calculate nutrition summary
     *
     * @param array $meals
     * @return array
     */
    private function calculateNutritionSummary(array $meals): array
    {
        $summary = [
            'vegetables' => 0,
            'protein' => 0,
            'grains' => 0,
            'fruits' => 0,
            'dairy' => 0,
        ];

        foreach ($meals as $meal) {
            foreach ($meal['ingredients'] as $ingredient) {
                $category = $this->getIngredientCategory($ingredient['item']);
                
                if (isset($summary[$category])) {
                    $summary[$category] += $ingredient['quantity'];
                }
            }
        }

        return [
            'vegetables' => round($summary['vegetables'], 1) . ' servings',
            'protein' => round($summary['protein'], 1) . ' servings',
            'grains' => round($summary['grains'], 1) . ' servings',
            'fruits' => round($summary['fruits'], 1) . ' servings',
            'dairy' => round($summary['dairy'], 1) . ' servings',
            'balanceScore' => $this->calculateBalanceScore($summary),
        ];
    }

    /**
     * Get ingredient category
     *
     * @param string $itemName
     * @return string
     */
    private function getIngredientCategory(string $itemName): string
    {
        $itemLower = strtolower($itemName);
        
        if (preg_match('/lettuce|tomato|cucumber|carrot|potato|onion|pepper|broccoli|zucchini|vegetable/i', $itemLower)) {
            return 'vegetables';
        }
        if (preg_match('/chicken|fish|egg|bean|protein/i', $itemLower)) {
            return 'protein';
        }
        if (preg_match('/rice|pasta|bread|oat|grain|granola/i', $itemLower)) {
            return 'grains';
        }
        if (preg_match('/banana|berries|lemon|fruit/i', $itemLower)) {
            return 'fruits';
        }
        if (preg_match('/milk|yogurt|cheese|butter|dairy/i', $itemLower)) {
            return 'dairy';
        }
        
        return 'other';
    }

    /**
     * Calculate balance score based on nutrition distribution
     *
     * @param array $summary
     * @return string
     */
    private function calculateBalanceScore(array $summary): string
    {
        $total = array_sum($summary);
        if ($total == 0) return 'N/A';

        $ideal = ['vegetables' => 0.30, 'protein' => 0.25, 'grains' => 0.25, 'fruits' => 0.15, 'dairy' => 0.05];
        $score = 100;

        foreach ($ideal as $category => $targetRatio) {
            $actualRatio = $summary[$category] / $total;
            $deviation = abs($actualRatio - $targetRatio);
            $score -= ($deviation * 100);
        }

        $score = max(0, min(100, $score));

        if ($score >= 80) return 'Excellent';
        if ($score >= 60) return 'Good';
        if ($score >= 40) return 'Fair';
        return 'Needs Improvement';
    }
}
