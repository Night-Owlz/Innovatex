import os
import django
import json
from unittest.mock import MagicMock, patch

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_project.settings')
django.setup()

from mainapp.services import SDGScorer
from mainapp.models import UserBase

print("=" * 80)
print("🌍 VERIFYING SDG SCORING FEATURE")
print("=" * 80)

# 1. Setup Test User
print("\n1. Setting up test user...")
user, _ = UserBase.objects.get_or_create(
    user_id="sdg_verify_user",
    defaults={'name': "SDG Verify User", 'email': "sdg_verify@example.com"}
)
print(f"✅ User ready: {user.name}")

# 2. Mock External Data
print("\n2. Mocking external data (Waste, Nutrition, Meals)...")
mock_waste_data = [{
    'weekly_waste_grams': 150,  # Low waste!
    'weekly_waste_cost': 200
}]

mock_nutrient_data = [{
    'deficiencies': [
        {'nutrient': 'iron', 'percentage': 60, 'severity': 'medium'}
    ]
}]

mock_meal_data = [{
    'plan_data': [
        {'meals': [{'ingredients': [{'item': 'Rice'}, {'item': 'Lentils'}]}]}
    ]
}]

# 3. Test SDG Scorer Logic
print("\n3. Testing SDGScorer logic...")

# Mock the requests.get calls inside SDGScorer
with patch('requests.get') as mock_get:
    def side_effect(url, headers, timeout):
        mock_response = MagicMock()
        mock_response.status_code = 200
        if 'waste-predictions' in url:
            mock_response.json.return_value = mock_waste_data
        elif 'nutrient-analyses' in url:
            mock_response.json.return_value = mock_nutrient_data
        elif 'meal-plans' in url:
            mock_response.json.return_value = mock_meal_data
        else:
            mock_response.json.return_value = []
        return mock_response

    mock_get.side_effect = side_effect

    scorer = SDGScorer("fake_token")
    
    # Calculate Score
    sdg_score = scorer.calculate_sdg_score(user, "2025-11-24")
    
    print(f"\n📊 SDG Score Results:")
    print(f"  • Overall Score: {sdg_score.overall_sdg_score}/100")
    print(f"  • SDG 2 (Zero Hunger): {sdg_score.sdg_2_score}/100")
    print(f"  • SDG 12 (Responsible Consumption): {sdg_score.sdg_12_score}/100")
    
    print(f"\n💡 AI Insights:")
    print(f"  • Insight: {sdg_score.weekly_insight}")
    print(f"  • Celebration: {sdg_score.celebration_message}")
    
    print(f"\n📝 Action Steps:")
    for step in sdg_score.action_steps:
        print(f"  - {step['title']} ({step['sdg_target']}): {step['potentialImpact']}")

    # Assertions
    if sdg_score.overall_sdg_score > 0:
        print("\n✅ SDG Score calculation verified!")
    else:
        print("\n❌ SDG Score calculation failed (Score is 0)")

    if sdg_score.weekly_insight:
        print("✅ AI Insights generation verified!")
    else:
        print("❌ AI Insights generation failed")

print("\n" + "=" * 80)
print("🎉 SDG Feature Verification Complete!")
print("=" * 80)
