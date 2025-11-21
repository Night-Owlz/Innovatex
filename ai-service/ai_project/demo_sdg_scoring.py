import os
import django
from unittest.mock import MagicMock

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ai_project.settings')
django.setup()

from mainapp.services import ImpactScorer
from mainapp.models import UserBase

print("=" * 80)
print("🌍 SDG IMPACT SCORING ENGINE - DEMO")
print("=" * 80)

# Create test user
user, _ = UserBase.objects.get_or_create(
    user_id="sdg_demo_user",
    defaults={'name': "SDG Demo User", 'email': "sdg@example.com"}
)

# Create scorer
scorer = ImpactScorer("fake_token")

# Calculate score
print("\n📊 Calculating Personal SDG Score...")
print("-" * 80)

score = scorer.calculate_score(user)

print(f"\n🎯 OVERALL SDG SCORE: {score.overall_score}/100")
print("=" * 80)

print(f"\n📈 Component Scores:")
print(f"  • Waste Reduction (40%):      {score.waste_reduction_score}/100")
print(f"  • Nutrition Balance (30%):    {score.nutrition_balance_score}/100")
print(f"  • Inventory Utilization (20%): {score.inventory_utilization_score}/100")
print(f"  • Sustainable Practices (10%): {score.sustainable_practices_score}/100")

print(f"\n💡 Weekly Insights:")
print("-" * 80)
print(score.insights)

print(f"\n🎯 Actionable Next Steps:")
print("-" * 80)
for i, step in enumerate(score.action_steps, 1):
    print(f"\n{i}. {step['title']} ({step['category'].upper()})")
    print(f"   {step['description']}")
    print(f"   💪 Potential Impact: {step['potentialImpact']}")

# Score interpretation
print(f"\n📊 Score Interpretation:")
print("-" * 80)
if score.overall_score >= 80:
    rating = "⭐⭐⭐⭐⭐ EXCELLENT"
    message = "You're a sustainability champion!"
elif score.overall_score >= 60:
    rating = "⭐⭐⭐⭐ GOOD"
    message = "You're making great progress!"
elif score.overall_score >= 40:
    rating = "⭐⭐⭐ FAIR"
    message = "You're on the right track!"
else:
    rating = "⭐⭐ NEEDS WORK"
    message = "Small steps lead to big changes!"

print(f"Rating: {rating}")
print(f"Message: {message}")

print("\n" + "=" * 80)
print("✅ SDG Impact Score calculated successfully!")
print("=" * 80)
