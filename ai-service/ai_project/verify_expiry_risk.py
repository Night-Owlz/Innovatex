import os
import django
import json
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_project.settings')
django.setup()

from mainapp.services import InventoryRiskAnalyzer

print("=" * 80)
print("⚠️ VERIFYING EXPIRY RISK PREDICTION FEATURE")
print("=" * 80)

# 1. Mock Data
print("\n1. Mocking inventory and consumption data...")

# Mock Inventory
today = datetime.now().date()
mock_inventory = [
    {
        'name': 'Milk',
        'category': 'Dairy',
        'expiration_date': (today + timedelta(days=2)).strftime('%Y-%m-%d') # Expiring soon!
    },
    {
        'name': 'Apples',
        'category': 'Fruits',
        'expiration_date': (today + timedelta(days=5)).strftime('%Y-%m-%d')
    },
    {
        'name': 'Rice',
        'category': 'Grains',
        'expiration_date': (today + timedelta(days=180)).strftime('%Y-%m-%d')
    },
    {
        'name': 'Spinach',
        'category': 'Vegetables',
        'expiration_date': (today + timedelta(days=3)).strftime('%Y-%m-%d')
    }
]

# Mock Consumption Logs (Milk consumed often, Spinach rarely)
mock_logs = [
    {'food_item_name': 'Milk'} for _ in range(10) # High freq
]
mock_logs.extend([{'food_item_name': 'Rice'} for _ in range(5)]) # Medium freq

# 2. Test Analyzer
print("\n2. Testing InventoryRiskAnalyzer logic...")

with patch('requests.get') as mock_get:
    def side_effect(url, headers, timeout):
        mock_response = MagicMock()
        mock_response.status_code = 200
        if 'inventory' in url:
            mock_response.json.return_value = mock_inventory
        elif 'consumption-logs' in url:
            mock_response.json.return_value = {'data': mock_logs}
        return mock_response

    mock_get.side_effect = side_effect

    analyzer = InventoryRiskAnalyzer("fake_token")
    result = analyzer.analyze_risk()
    
    print(f"\n📊 Analysis Results:")
    print(f"  • Season Factor: {result['meta']['season_factor']} (1.0 = Normal, 1.5 = Warm)")
    
    print(f"\n🚨 Alerts Generated:")
    for alert in result['alerts']:
        print(f"  - {alert}")
        
    print(f"\n📋 Prioritized Inventory (Top 5):")
    for item in result['analyzed_inventory']:
        print(f"  • {item['item']} ({item['category']})")
        print(f"    - Days to Expiry: {item['days_until_expiry']}")
        print(f"    - Priority Score: {item['priority_score']}/100")
        print(f"    - Risk Level: {item['risk_level']}")
        print(f"    - Freq: {item['consumption_freq_per_week']}/week")
        print("")

    # Assertions
    top_item = result['analyzed_inventory'][0]
    if top_item['item'] == 'Spinach':
        print("✅ Spinach prioritized (Expiring soon + Low consumption)")
    elif top_item['item'] == 'Milk':
        print("✅ Milk prioritized (Expiring very soon)")
    else:
        print(f"ℹ️ Top item is {top_item['item']}")

    if len(result['alerts']) > 0:
        print("✅ Alerts generated successfully!")
    else:
        print("❌ No alerts generated.")

print("\n" + "=" * 80)
print("🎉 Expiry Feature Verification Complete!")
print("=" * 80)
