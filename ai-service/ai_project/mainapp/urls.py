from django.urls import path
from . import views

urlpatterns = [
    path('ai/analyze-patterns', views.analyze_patterns, name='analyze_patterns'),
    path('ai/waste-estimation', views.estimate_waste, name='estimate_waste'),
    path('ai/nutrient-gaps', views.analyze_nutrient_gaps, name='analyze_nutrient_gaps'),
    path('ai/optimize-meal-plan', views.optimize_meal_plan, name='optimize_meal_plan'),
    path('ai/calculate-impact-score', views.calculate_impact_score, name='calculate_impact_score'),
]
