import os
import django
import pandas as pd
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_project.settings')
django.setup()

from mainapp.services import ConsumptionAnalyzer
from mainapp.models import UserBase

def verify_analysis():
    print("Verifying Consumption Pattern Analyzer...")
    
    # Mock user
    user, _ = UserBase.objects.get_or_create(
        user_id="test_user",
        defaults={'name': "Test User", 'email': "test@example.com"}
    )
    
    # Mock data
    today = datetime.now()
    mock_logs = [
        {'category': 'Vegetables', 'quantity': 5, 'consumption_date': (today - timedelta(days=1)).strftime('%Y-%m-%d')},
        {'category': 'Vegetables', 'quantity': 6, 'consumption_date': (today - timedelta(days=2)).strftime('%Y-%m-%d')},
        {'category': 'Dairy', 'quantity': 2, 'consumption_date': (today - timedelta(days=1)).strftime('%Y-%m-%d')},
        {'category': 'Meat', 'quantity': 10, 'consumption_date': (today - timedelta(days=20)).strftime('%Y-%m-%d')}, # Under consumption
    ]
    
    mock_inventory = [
        {'item_name': 'Milk', 'category': 'Dairy', 'expiration_date': (today + timedelta(days=2)).strftime('%Y-%m-%d')}, # Expires soon
        {'item_name': 'Carrots', 'category': 'Vegetables', 'expiration_date': (today + timedelta(days=10)).strftime('%Y-%m-%d')},
    ]
    
    # Mock analyzer
    analyzer = ConsumptionAnalyzer("fake_token")
    analyzer.fetch_data = MagicMock(return_value=(mock_logs, mock_inventory))
    
    # Run analysis
    print("Running analysis...")
    analysis = analyzer.analyze(user)
    
    # Verify results
    print("\n--- Results ---")
    print(f"Weekly Trends: {analysis.weekly_trends}")
    print(f"Over Consumption: {analysis.over_consumption}")
    print(f"Under Consumption: {analysis.under_consumption}")
    print(f"Waste Risk Items: {analysis.waste_risk_items}")
    
    # Assertions
    assert 'Vegetables' in str(analysis.weekly_trends), "Weekly trends should contain Vegetables"
    assert any(item['category'] == 'Meat' for item in analysis.under_consumption), "Meat should be under consumed"
    assert any(item['item'] == 'Milk' for item in analysis.waste_risk_items), "Milk should be a waste risk"
    
    print("\n✅ Verification Successful!")

if __name__ == "__main__":
    verify_analysis()
