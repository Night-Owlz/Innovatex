from django.core.management.base import BaseCommand
from mainapp.services import ConsumptionAnalyzer
from mainapp.models import UserBase
from unittest.mock import MagicMock
from datetime import datetime, timedelta
import pandas as pd

class Command(BaseCommand):
    help = 'Verifies the Consumption Pattern Analyzer logic'

    def handle(self, *args, **kwargs):
        self.stdout.write("Verifying Consumption Pattern Analyzer...")
        
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
        self.stdout.write("Running analysis...")
        analysis = analyzer.analyze(user)
        
        # Verify results
        self.stdout.write("\n--- Results ---")
        self.stdout.write(f"Weekly Trends: {analysis.weekly_trends}")
        self.stdout.write(f"Over Consumption: {analysis.over_consumption}")
        self.stdout.write(f"Under Consumption: {analysis.under_consumption}")
        self.stdout.write(f"Waste Risk Items: {analysis.waste_risk_items}")
        
        self.stdout.write(f"Imbalanced Patterns: {analysis.imbalanced_patterns}")
        
        # Assertions
        try:
            assert 'Vegetables' in str(analysis.weekly_trends), "Weekly trends should contain Vegetables"
            assert any(item['category'] == 'Meat' for item in analysis.under_consumption), "Meat should be under consumed"
            assert any(item['item'] == 'Milk' for item in analysis.waste_risk_items), "Milk should be a waste risk"
            assert any(item['category'] == 'Vegetables' and item['status'] == 'high' for item in analysis.imbalanced_patterns), "Vegetables should be high consumption"
            self.stdout.write(self.style.SUCCESS("\n✅ Verification Successful!"))
        except AssertionError as e:
            self.stdout.write(self.style.ERROR(f"\n❌ Verification Failed: {str(e)}"))
