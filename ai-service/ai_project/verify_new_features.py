import os
import django
import pandas as pd
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_project.settings')
django.setup()

from mainapp.services import WasteEstimator, NutrientAnalyzer, MealOptimizer, ImpactScorer
from mainapp.models import UserBase, WastePrediction

def verify_new_features():
    print("Verifying Waste Prediction and Nutrient Gap Analysis...")
    
    # Mock user
    user, _ = UserBase.objects.get_or_create(
        user_id="test_user_2",
        defaults={'name': "Test User 2", 'email': "test2@example.com"}
    )
    
    # --- Verify Waste Estimator ---
    print("\n1. Verifying Waste Estimator...")
    
    today = datetime.now()
    mock_inventory = [
        {'item_name': 'Milk', 'quantity': 1, 'unit': 'l', 'expiration_date': (today - timedelta(days=1)).strftime('%Y-%m-%d'), 'food_item': {'cost_per_unit': 2.5}}, # Expired
        {'item_name': 'Bread', 'quantity': 500, 'unit': 'g', 'expiration_date': (today - timedelta(days=2)).strftime('%Y-%m-%d'), 'food_item': {'cost_per_unit': 0.01}}, # Expired
        {'item_name': 'Apples', 'quantity': 5, 'unit': 'pcs', 'expiration_date': (today + timedelta(days=5)).strftime('%Y-%m-%d'), 'food_item': {'cost_per_unit': 0.5}}, # Not expired
    ]
    
    estimator = WasteEstimator("fake_token")
    estimator.fetch_inventory = MagicMock(return_value=mock_inventory)
    
    prediction = estimator.estimate_waste(user)
    
    print(f"Weekly Waste Grams: {prediction.weekly_waste_grams}")
    print(f"Weekly Waste Cost: {prediction.weekly_waste_cost}")
    
    # Assertions
    # Milk (1000g) + Bread (500g) = 1500g wasted
    # Weekly projection = (1500 / 30) * 7 = 350g
    expected_weekly_grams = (1500 / 30) * 7
    assert float(prediction.weekly_waste_grams) == expected_weekly_grams, f"Expected {expected_weekly_grams}, got {prediction.weekly_waste_grams}"
    print("✅ Waste Estimator Verified!")
    
    # --- Verify Nutrient Analyzer ---
    print("\n2. Verifying Nutrient Analyzer...")
    
    mock_logs = [
        {'category': 'Vegetables', 'quantity': 100, 'unit': 'g', 'consumption_date': today.strftime('%Y-%m-%d')}, # 20mg Vit C
        {'category': 'Fruits', 'quantity': 100, 'unit': 'g', 'consumption_date': today.strftime('%Y-%m-%d')}, # 30mg Vit C
        # Total Vit C = 50mg. Daily avg (over 7 days) = 50/7 = 7.14mg. RDA = 90mg. % = 7.9%. Deficiency!
    ]
    
    analyzer = NutrientAnalyzer("fake_token")
    analyzer.fetch_consumption = MagicMock(return_value=mock_logs)
    
    analysis = analyzer.analyze_gaps(user)
    
    print(f"Deficiencies: {analysis['deficiencies']}")
    
    # Assertions
    assert any(d['nutrient'] == 'vitamin_c' for d in analysis['deficiencies']), "Should detect Vitamin C deficiency"
    print("✅ Nutrient Analyzer Verified!")
    
    # --- Verify Meal Optimizer ---
    print("\n3. Verifying Meal Optimizer...")
    
    # Mock profile for budget
    mock_profile = {'budget_range': 'medium'} # 5000 BDT
    
    optimizer = MealOptimizer("fake_token")
    optimizer.fetch_user_profile = MagicMock(return_value=mock_profile)
    optimizer.fetch_inventory = MagicMock(return_value=mock_inventory)
    
    meal_plan = optimizer.optimize_plan(user, "2025-11-24")
    
    print(f"Total Cost: {meal_plan.total_cost}")
    print(f"Budget Remaining: {meal_plan.budget_remaining}")
    print(f"Shopping List Items: {len(meal_plan.shopping_list)}")
    
    # Assertions
    assert meal_plan.total_cost > 0, "Total cost should be calculated"
    assert meal_plan.budget_remaining < 5000, "Budget should be consumed"
    print("✅ Meal Optimizer Verified!")
    
    # --- Verify Impact Scorer ---
    print("\n4. Verifying Impact Scorer...")
    
    scorer = ImpactScorer("fake_token")
    score = scorer.calculate_score(user)
    
    print(f"Overall Score: {score.overall_score}")
    print(f"Insights: {score.insights}")
    
    # Assertions
    assert 0 <= score.overall_score <= 100, "Score should be between 0 and 100"
    print("✅ Impact Scorer Verified!")
    
    print("\n🎉 All New Features Verified Successfully!")

if __name__ == "__main__":
    verify_new_features()
