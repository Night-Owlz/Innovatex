<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ResourceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $resources = [
            ['title' => 'Complete Guide to Composting at Home', 'description' => 'Learn how to turn food scraps into nutrient-rich compost for your garden', 'url' => 'https://example.com/composting-guide', 'category' => 'waste_reduction', 'type' => 'guide', 'tags' => ['composting', 'waste', 'garden']],
            ['title' => 'Creative Ways to Use Food Leftovers', 'description' => 'Transform yesterday\'s meal into today\'s delicious dish', 'url' => 'https://example.com/leftovers-ideas', 'category' => 'waste_reduction', 'type' => 'article', 'tags' => ['leftovers', 'recipes', 'waste']],
            ['title' => 'Zero Waste Kitchen Tips', 'description' => 'Practical strategies to minimize food waste in your kitchen', 'url' => 'https://example.com/zero-waste-kitchen', 'category' => 'waste_reduction', 'type' => 'article', 'tags' => ['waste', 'kitchen', 'sustainability']],
            ['title' => 'Food Preservation Methods', 'description' => 'Learn various techniques to extend the shelf life of your food', 'url' => 'https://example.com/food-preservation', 'category' => 'waste_reduction', 'type' => 'video', 'tags' => ['preservation', 'storage', 'waste']],
            ['title' => 'Understanding Food Labels and Expiration Dates', 'description' => 'Decode expiration dates to reduce unnecessary food waste', 'url' => 'https://example.com/food-labels', 'category' => 'waste_reduction', 'type' => 'article', 'tags' => ['labels', 'expiration', 'waste']],
            
            ['title' => 'Budget Meal Planning for Families', 'description' => 'Save money while eating healthy with smart meal planning', 'url' => 'https://example.com/budget-meals', 'category' => 'budget_tips', 'type' => 'guide', 'tags' => ['budget', 'planning', 'family']],
            ['title' => 'Smart Shopping: How to Save on Groceries', 'description' => 'Expert tips for cutting your grocery bill without sacrificing quality', 'url' => 'https://example.com/smart-shopping', 'category' => 'budget_tips', 'type' => 'article', 'tags' => ['shopping', 'budget', 'savings']],
            ['title' => 'Bulk Buying Guide', 'description' => 'When and what to buy in bulk to maximize savings', 'url' => 'https://example.com/bulk-buying', 'category' => 'budget_tips', 'type' => 'article', 'tags' => ['bulk', 'budget', 'shopping']],
            ['title' => 'Seasonal Eating on a Budget', 'description' => 'Save money by choosing seasonal produce and ingredients', 'url' => 'https://example.com/seasonal-eating', 'category' => 'budget_tips', 'type' => 'guide', 'tags' => ['seasonal', 'budget', 'produce']],
            
            ['title' => 'Weekly Meal Prep for Beginners', 'description' => 'Step-by-step guide to preparing a week\'s worth of meals', 'url' => 'https://example.com/meal-prep', 'category' => 'meal_planning', 'type' => 'video', 'tags' => ['meal prep', 'planning', 'cooking']],
            ['title' => 'Balanced Meal Planning Template', 'description' => 'Free downloadable template for planning nutritious meals', 'url' => 'https://example.com/meal-template', 'category' => 'meal_planning', 'type' => 'tool', 'tags' => ['template', 'planning', 'nutrition']],
            ['title' => 'Quick and Easy Weeknight Dinners', 'description' => '30-minute meal ideas for busy families', 'url' => 'https://example.com/weeknight-dinners', 'category' => 'meal_planning', 'type' => 'article', 'tags' => ['quick meals', 'dinner', 'family']],
            ['title' => 'Meal Planning for Different Dietary Needs', 'description' => 'How to plan meals for various dietary preferences and restrictions', 'url' => 'https://example.com/dietary-planning', 'category' => 'meal_planning', 'type' => 'guide', 'tags' => ['dietary', 'planning', 'health']],
            
            ['title' => 'Proper Refrigerator Organization', 'description' => 'Maximize freshness by organizing your fridge correctly', 'url' => 'https://example.com/fridge-organization', 'category' => 'storage_tips', 'type' => 'article', 'tags' => ['refrigerator', 'storage', 'organization']],
            ['title' => 'Freezing Foods: A Complete Guide', 'description' => 'Learn which foods freeze well and proper freezing techniques', 'url' => 'https://example.com/freezing-guide', 'category' => 'storage_tips', 'type' => 'guide', 'tags' => ['freezing', 'storage', 'preservation']],
            ['title' => 'Pantry Organization Tips', 'description' => 'Keep your pantry neat and ingredients fresh with these tips', 'url' => 'https://example.com/pantry-tips', 'category' => 'storage_tips', 'type' => 'article', 'tags' => ['pantry', 'organization', 'storage']],
            ['title' => 'Food Storage Container Guide', 'description' => 'Choosing the right containers for different types of food', 'url' => 'https://example.com/storage-containers', 'category' => 'storage_tips', 'type' => 'guide', 'tags' => ['containers', 'storage', 'organization']],
            
            ['title' => 'Building a Balanced Plate', 'description' => 'Understanding portion sizes and nutritional balance', 'url' => 'https://example.com/balanced-plate', 'category' => 'nutrition', 'type' => 'article', 'tags' => ['nutrition', 'balance', 'health']],
            ['title' => 'Essential Vitamins and Minerals Guide', 'description' => 'Learn which nutrients your body needs and where to find them', 'url' => 'https://example.com/vitamins-guide', 'category' => 'nutrition', 'type' => 'guide', 'tags' => ['vitamins', 'nutrition', 'health']],
            ['title' => 'Healthy Eating on a Budget', 'description' => 'Nutritious food choices that won\'t break the bank', 'url' => 'https://example.com/healthy-budget', 'category' => 'nutrition', 'type' => 'article', 'tags' => ['nutrition', 'budget', 'health']],
        ];

        foreach ($resources as $resource) {
            \App\Models\Resource::create($resource);
        }
    }
}
