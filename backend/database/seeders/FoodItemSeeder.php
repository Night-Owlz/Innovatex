<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class FoodItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $foodItems = [
            ['name' => 'Apple', 'category' => 'fruit', 'typical_expiration_days' => 14, 'cost_per_unit' => 2.50, 'unit' => 'kg'],
            ['name' => 'Banana', 'category' => 'fruit', 'typical_expiration_days' => 7, 'cost_per_unit' => 1.80, 'unit' => 'kg'],
            ['name' => 'Orange', 'category' => 'fruit', 'typical_expiration_days' => 10, 'cost_per_unit' => 3.00, 'unit' => 'kg'],
            ['name' => 'Grapes', 'category' => 'fruit', 'typical_expiration_days' => 5, 'cost_per_unit' => 4.50, 'unit' => 'kg'],
            ['name' => 'Mango', 'category' => 'fruit', 'typical_expiration_days' => 7, 'cost_per_unit' => 5.00, 'unit' => 'kg'],
            ['name' => 'Strawberry', 'category' => 'fruit', 'typical_expiration_days' => 3, 'cost_per_unit' => 6.00, 'unit' => 'kg'],
            
            ['name' => 'Carrot', 'category' => 'vegetable', 'typical_expiration_days' => 14, 'cost_per_unit' => 1.50, 'unit' => 'kg'],
            ['name' => 'Broccoli', 'category' => 'vegetable', 'typical_expiration_days' => 7, 'cost_per_unit' => 3.50, 'unit' => 'kg'],
            ['name' => 'Spinach', 'category' => 'vegetable', 'typical_expiration_days' => 5, 'cost_per_unit' => 2.80, 'unit' => 'kg'],
            ['name' => 'Tomato', 'category' => 'vegetable', 'typical_expiration_days' => 7, 'cost_per_unit' => 2.00, 'unit' => 'kg'],
            ['name' => 'Potato', 'category' => 'vegetable', 'typical_expiration_days' => 30, 'cost_per_unit' => 1.20, 'unit' => 'kg'],
            ['name' => 'Onion', 'category' => 'vegetable', 'typical_expiration_days' => 30, 'cost_per_unit' => 1.00, 'unit' => 'kg'],
            
            ['name' => 'Milk', 'category' => 'dairy', 'typical_expiration_days' => 7, 'cost_per_unit' => 3.50, 'unit' => 'liters'],
            ['name' => 'Cheese', 'category' => 'dairy', 'typical_expiration_days' => 14, 'cost_per_unit' => 8.00, 'unit' => 'kg'],
            ['name' => 'Yogurt', 'category' => 'dairy', 'typical_expiration_days' => 14, 'cost_per_unit' => 4.50, 'unit' => 'kg'],
            ['name' => 'Butter', 'category' => 'dairy', 'typical_expiration_days' => 30, 'cost_per_unit' => 6.00, 'unit' => 'kg'],
            
            ['name' => 'Rice', 'category' => 'grain', 'typical_expiration_days' => 365, 'cost_per_unit' => 2.00, 'unit' => 'kg'],
            ['name' => 'Bread', 'category' => 'grain', 'typical_expiration_days' => 7, 'cost_per_unit' => 2.50, 'unit' => 'pieces'],
            ['name' => 'Pasta', 'category' => 'grain', 'typical_expiration_days' => 365, 'cost_per_unit' => 1.80, 'unit' => 'kg'],
            ['name' => 'Oats', 'category' => 'grain', 'typical_expiration_days' => 365, 'cost_per_unit' => 3.00, 'unit' => 'kg'],
            
            ['name' => 'Chicken', 'category' => 'protein', 'typical_expiration_days' => 2, 'cost_per_unit' => 7.50, 'unit' => 'kg'],
            ['name' => 'Eggs', 'category' => 'protein', 'typical_expiration_days' => 21, 'cost_per_unit' => 4.00, 'unit' => 'dozen'],
            ['name' => 'Beans', 'category' => 'protein', 'typical_expiration_days' => 365, 'cost_per_unit' => 2.50, 'unit' => 'kg'],
            ['name' => 'Tofu', 'category' => 'protein', 'typical_expiration_days' => 7, 'cost_per_unit' => 3.50, 'unit' => 'kg'],
            
            ['name' => 'Orange Juice', 'category' => 'beverage', 'typical_expiration_days' => 7, 'cost_per_unit' => 4.50, 'unit' => 'liters'],
            ['name' => 'Tea', 'category' => 'beverage', 'typical_expiration_days' => 365, 'cost_per_unit' => 5.00, 'unit' => 'kg'],
            ['name' => 'Coffee', 'category' => 'beverage', 'typical_expiration_days' => 365, 'cost_per_unit' => 12.00, 'unit' => 'kg'],
        ];

        foreach ($foodItems as $item) {
            \App\Models\FoodItem::create($item);
        }
    }
}
