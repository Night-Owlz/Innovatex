import os
import django
from unittest.mock import MagicMock

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_project.settings')
django.setup()

from mainapp.services import ImpactScorer
from mainapp.models import UserBase

print("=" * 80)
print("🔙 VERIFYING IMPACT SCORER REVERSION")
print("=" * 80)

# Create test user
user, _ = UserBase.objects.get_or_create(
    user_id="impact_revert_user",
    defaults={'name': "Impact Revert User", 'email': "revert@example.com"}
)

# Create scorer
scorer = ImpactScorer("fake_token")

# Calculate score
print("\n📊 Calculating Impact Score (Should be mocked/simple version)...")
score = scorer.calculate_score(user)

print(f"\n🎯 OVERALL SCORE: {score.overall_score}")
print(f"💡 Insights: {score.insights}")

# Check if it matches the "useless" previous version values
if score.overall_score == 76.0: # Calculated from mocked values: (85*0.4 + 70*0.3 + 60*0.2 + 90*0.1) = 34 + 21 + 12 + 9 = 76
    print("\n✅ ImpactScorer successfully reverted to previous version!")
else:
    print(f"\n❌ ImpactScorer NOT reverted correctly. Score: {score.overall_score}")

print("\n" + "=" * 80)
