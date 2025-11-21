import os
import django
import json
from unittest.mock import MagicMock
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_project.settings')
django.setup()

from mainapp.services import MealOptimizer
from mainapp.models import UserBase

# Create test user
user, _ = UserBase.objects.get_or_create(
    user_id="demo_user",
    defaults={'name': "Demo User", 'email': "demo@example.com"}
)

# Mock data
mock_profile = {'budget_range': 'medium'}
today = datetime.now()
mock_inventory = [
    {'item_name': 'Milk', 'quantity': 1, 'unit': 'l', 'expiration_date': (today + timedelta(days=2)).strftime('%Y-%m-%d')},
    {'item_name': 'Eggs', 'quantity': 6, 'unit': 'pcs', 'expiration_date': (today + timedelta(days=3)).strftime('%Y-%m-%d')},
]

# Create optimizer
optimizer = MealOptimizer("fake_token")
optimizer.fetch_user_profile = MagicMock(return_value=mock_profile)
optimizer.fetch_inventory = MagicMock(return_value=mock_inventory)

# Generate meal plan
meal_plan = optimizer.optimize_plan(user, "2025-11-25")

# Display results
print("=" * 80)
print("🍽️  WEEKLY MEAL PLAN - DEMO OUTPUT")
print("=" * 80)
print(f"\n📅 Week Starting: {meal_plan.week_start_date}")
print(f"💰 Budget: 5000 BDT")
print(f"💵 Total Cost: {meal_plan.total_cost} BDT")
print(f"💳 Remaining: {meal_plan.budget_remaining} BDT")
print(f"\n📊 Shopping List ({len(meal_plan.shopping_list)} items):")
print("-" * 80)
for item in meal_plan.shopping_list[:5]:  # Show first 5
    print(f"  • {item['item']}: {item['quantity']} {item['unit']} - {item['estimatedCost']} BDT")
if len(meal_plan.shopping_list) > 5:
    print(f"  ... and {len(meal_plan.shopping_list) - 5} more items")

print(f"\n📋 Sample Meals (Monday):")
print("-" * 80)
monday_meals = meal_plan.plan_data[0]['meals']
for meal in monday_meals:
    print(f"\n  {meal['type']}: {meal['name']}")
    print(f"    Ingredients:")
    for ing in meal['ingredients']:
        source_icon = "🏠" if ing['source'] == 'inventory' else "🛒"
        cost_str = f" ({ing.get('estimatedCost', 0)} BDT)" if ing['source'] == 'purchase' else ""
        print(f"      {source_icon} {ing['item']}: {ing['quantity']} {ing['unit']}{cost_str}")
    if meal.get('alternatives'):
        print(f"    💡 Alternatives: {', '.join(meal['alternatives'])}")
    if meal.get('nutrition'):
        nut = meal['nutrition']
        print(f"    📊 Nutrition: {nut.get('calories', 0):.1f} cal, {nut.get('protein', 0):.1f}g protein")

print(f"\n🥗 Weekly Nutrition Summary:")
print("-" * 80)
nut_summary = meal_plan.nutrition_summary
if 'daily_average' in nut_summary:
    daily = nut_summary['daily_average']
    print(f"  Daily Average:")
    print(f"    • Calories: {daily.get('calories', 0):.1f}")
    print(f"    • Protein: {daily.get('protein', 0):.1f}g")
    print(f"    • Carbs: {daily.get('carbs', 0):.1f}g")
    print(f"    • Fiber: {daily.get('fiber', 0):.1f}g")

if 'requirements_met' in nut_summary:
    req_met = nut_summary['requirements_met']
    print(f"\n  Requirements Met (% of RDA):")
    for nutrient, percentage in list(req_met.items())[:4]:
        bar = "█" * int(percentage / 10) + "░" * (10 - int(percentage / 10))
        print(f"    • {nutrient.capitalize()}: [{bar}] {percentage}%")

print("\n" + "=" * 80)
print("✅ Meal plan generated successfully!")
print("=" * 80)
