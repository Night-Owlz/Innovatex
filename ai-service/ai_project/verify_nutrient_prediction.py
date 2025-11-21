import os
import django
import json
from unittest.mock import MagicMock, patch
import pandas as pd

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_project.settings')
django.setup()

from mainapp.services import NutrientAnalyzer
from mainapp.models import UserBase

print("=" * 80)
print("🍎 VERIFYING NUTRIENT GAP PREDICTION FEATURE")
print("=" * 80)

# 1. Setup Test User
print("\n1. Setting up test user...")
user, _ = UserBase.objects.get_or_create(
    user_id="nutrient_verify_user",
    defaults={'name': "Nutrient Verify User", 'email': "nutrient@example.com"}
)
print(f"✅ User ready: {user.name}")

# 2. Mock Consumption Data
print("\n2. Mocking consumption data...")
# Create mock logs for last 7 days with low Vitamin C and Iron
mock_logs = [
    {
        'consumption_date': (pd.Timestamp.now() - pd.Timedelta(days=i)).strftime('%Y-%m-%d'),
        'food_item_name': 'Rice',
        'quantity': 200,
        'unit': 'g'
    } for i in range(7)
]
# Add some chicken (protein) but no veggies/fruits
mock_logs.extend([
    {
        'consumption_date': (pd.Timestamp.now() - pd.Timedelta(days=i)).strftime('%Y-%m-%d'),
        'food_item_name': 'Chicken',
        'quantity': 100,
        'unit': 'g'
    } for i in range(0, 7, 2)
])

# 3. Test Nutrient Analyzer
print("\n3. Testing NutrientAnalyzer logic...")

with patch('requests.get') as mock_get, \
     patch('requests.post') as mock_post:
    
    # Mock consumption logs response
    mock_response_logs = MagicMock()
    mock_response_logs.status_code = 200
    mock_response_logs.json.return_value = {
        'success': True,
        'data': mock_logs,
        'pagination': {'last_page': 1}
    }
    mock_get.return_value = mock_response_logs

    # Mock Gemini API response
    mock_response_ai = MagicMock()
    mock_response_ai.status_code = 200
    ai_output = [
        {
            "food": "Spinach Salad with Lemon",
            "reason": "Spinach provides iron, and lemon (Vitamin C) helps absorption.",
            "nutrients": ["iron", "vitamin_c"]
        },
        {
            "food": "Guava",
            "reason": "Extremely high in Vitamin C to boost immunity.",
            "nutrients": ["vitamin_c"]
        },
        {
            "food": "Lentil Soup",
            "reason": "Good source of iron and fiber.",
            "nutrients": ["iron", "fiber"]
        }
    ]
    mock_response_ai.json.return_value = {
        'candidates': [{'content': {'parts': [{'text': json.dumps(ai_output)}]}}]
    }
    mock_post.return_value = mock_response_ai

    analyzer = NutrientAnalyzer("fake_token")
    analysis = analyzer.analyze_gaps(user)
    
    print(f"\n📊 Analysis Results:")
    
    print(f"\n📉 Deficiencies Found:")
    for gap in analysis['deficiencies']:
        print(f"  • {gap['nutrient'].title()}: {gap['percentage']}% of RDA (Severity: {gap['severity']})")
        
    print(f"\n🤖 AI Suggestions:")
    for sugg in analysis['suggestions']:
        print(f"  • {sugg['food']}")
        print(f"    Reason: {sugg['reason']}")
        print(f"    Targets: {', '.join(sugg['nutrients'])}")

    # Assertions
    deficiencies = [d['nutrient'] for d in analysis['deficiencies']]
    if 'vitamin_c' in deficiencies or 'iron' in deficiencies:
        print("\n✅ Deficiencies correctly identified!")
    else:
        print("\n❌ Failed to identify deficiencies.")

    if len(analysis['suggestions']) > 0:
        print("✅ AI Suggestions generated!")
    else:
        print("❌ AI Suggestions failed.")

print("\n" + "=" * 80)
print("🎉 Nutrient Feature Verification Complete!")
print("=" * 80)
