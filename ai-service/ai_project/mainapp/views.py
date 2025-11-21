from django.shortcuts import render
import os
import requests
import json
from django.http import JsonResponse
from .decorators import *
from rest_framework.decorators import api_view, permission_classes

from .services import ConsumptionAnalyzer
from .models import PatternAnalysis
from django.forms.models import model_to_dict

@api_view(['POST'])
@authenticate_user
def analyze_patterns(request):
    try:
        analyzer = ConsumptionAnalyzer(request.user_token)
        analysis = analyzer.analyze(request.user)
        
        if not analysis:
            return JsonResponse({
                'success': False,
                'message': 'No consumption data found to analyze'
            }, status=404)
            
        return JsonResponse({
            'success': True,
            'message': 'Analysis completed successfully',
            'data': {
                'weeklyTrends': analysis.weekly_trends,
                'overConsumption': analysis.over_consumption,
                'underConsumption': analysis.under_consumption,
                'wasteRiskItems': analysis.waste_risk_items,
                'imbalancedPatterns': analysis.imbalanced_patterns,
                'heatmapData': analysis.heatmap_data,
                'healthScore': analysis.health_score,
                'summary': {
                    'totalCategories': analysis.total_categories_tracked,
                    'totalEntries': analysis.total_consumption_entries,
                    'wasteRiskCount': analysis.waste_risk_count
                }
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@api_view(['GET'])
@authenticate_user
def estimate_waste(request):
    try:
        from .services import WasteEstimator
        estimator = WasteEstimator(request.user_token)
        prediction = estimator.estimate_waste(request.user)
        
        if not prediction:
            return JsonResponse({
                'success': False,
                'message': 'Could not estimate waste (no inventory data)'
            }, status=404)
            
        return JsonResponse({
            'success': True,
            'message': 'Waste estimation completed successfully',
            'data': {
                'weeklyWasteGrams': float(prediction.weekly_waste_grams),
                'weeklyWasteCost': float(prediction.weekly_waste_cost),
                'projectedYearlyGrams': float(prediction.projected_yearly_grams),
                'projectedYearlyCost': float(prediction.projected_yearly_cost),
                'predictionDate': prediction.prediction_date
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)

@api_view(['GET'])
@authenticate_user
def analyze_nutrient_gaps(request):
    try:
        from .services import NutrientAnalyzer
        analyzer = NutrientAnalyzer(request.user_token)
        analysis = analyzer.analyze_gaps(request.user)
        
        if not analysis:
            return JsonResponse({
                'success': False,
                'message': 'Could not analyze nutrient gaps (no consumption data)'
            }, status=404)
            
        return JsonResponse({
            'success': True,
            'message': 'Nutrient gap analysis completed successfully',
            'data': analysis
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@api_view(['POST'])
@authenticate_user
def optimize_meal_plan(request):
    try:
        from .services import MealOptimizer
        from datetime import datetime
        
        week_start_date = request.data.get('weekStartDate', datetime.now().strftime('%Y-%m-%d'))
        custom_preferences = request.data.get('customPreferences')
        
        optimizer = MealOptimizer(request.user_token)
        meal_plan = optimizer.optimize_plan(request.user, week_start_date, custom_preferences)
        
        return JsonResponse({
            'success': True,
            'message': 'Meal plan optimized successfully',
            'data': {
                'planData': meal_plan.plan_data,
                'shoppingList': meal_plan.shopping_list,
                'totalCost': float(meal_plan.total_cost),
                'budgetRemaining': float(meal_plan.budget_remaining),
                'nutritionSummary': meal_plan.nutrition_summary
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@api_view(['GET'])
@authenticate_user
def calculate_impact_score(request):
    try:
        from .services import ImpactScorer
        scorer = ImpactScorer(request.user_token)
        score = scorer.calculate_score(request.user)
        
        return JsonResponse({
            'success': True,
            'message': 'Impact score calculated successfully',
            'data': {
                'overallScore': score.overall_score,
                'breakdown': {
                    'wasteReduction': score.waste_reduction_score,
                    'nutritionBalance': score.nutrition_balance_score,
                    'inventoryUtilization': score.inventory_utilization_score,
                    'sustainablePractices': score.sustainable_practices_score
                },
                'insights': score.insights,
                'actionSteps': score.action_steps
            }
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)
