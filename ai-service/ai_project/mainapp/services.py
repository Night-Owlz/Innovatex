import pandas as pd
import requests
import os
from datetime import datetime, timedelta
from django.utils import timezone
from .models import PatternAnalysis

class ConsumptionAnalyzer:
    def __init__(self, user_token):
        self.user_token = user_token
        self.base_url = os.getenv("BACKEND_BASE_URL")
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Accept": "application/json"
        }

    def fetch_data(self):
        """Fetch all consumption logs and inventory items from backend"""
        consumption_logs = self._fetch_all_pages(f"{self.base_url}/api/v1/consumption-logs")
        inventory_items = self._fetch_all_pages(f"{self.base_url}/api/v1/inventory")
        return consumption_logs, inventory_items

    def _fetch_all_pages(self, url):
        items = []
        page = 1
        while True:
            response = requests.get(f"{url}?page={page}&per_page=100", headers=self.headers)
            if response.status_code != 200:
                break
            
            data = response.json()
            if not data.get('success'):
                break
                
            items.extend(data.get('data', []))
            
            pagination = data.get('pagination', {})
            if page >= pagination.get('last_page', 1):
                break
            page += 1
            
        return items

    def analyze(self, user):
        consumption_logs, inventory_items = self.fetch_data()
        
        if not consumption_logs:
            return None

        # Convert to Pandas DataFrames
        logs_df = pd.DataFrame(consumption_logs)
        inventory_df = pd.DataFrame(inventory_items)

        # Preprocessing
        logs_df['consumption_date'] = pd.to_datetime(logs_df['consumption_date'])
        if not inventory_df.empty:
            inventory_df['expiration_date'] = pd.to_datetime(inventory_df['expiration_date'])

        # Analysis
        weekly_trends = self._calculate_weekly_trends(logs_df)
        over_consumption = self._detect_over_consumption(logs_df)
        under_consumption = self._detect_under_consumption(logs_df)
        waste_risk = self._predict_waste_risk(inventory_df, logs_df)
        imbalanced_patterns = self._detect_imbalanced_patterns(logs_df)
        heatmap_data = self._generate_heatmap_data(logs_df)

        # Create PatternAnalysis object
        analysis = PatternAnalysis.objects.create(
            user=user,
            period_start=logs_df['consumption_date'].min().date(),
            period_end=logs_df['consumption_date'].max().date(),
            weekly_trends=weekly_trends,
            over_consumption=over_consumption,
            under_consumption=under_consumption,
            waste_risk_items=waste_risk,
            imbalanced_patterns=imbalanced_patterns,
            heatmap_data=heatmap_data,
            total_categories_tracked=logs_df['category'].nunique(),
            total_consumption_entries=len(logs_df),
            waste_risk_count=len(waste_risk),
            health_score=self._calculate_health_score(waste_risk, over_consumption)
        )
        
        return analysis

    def _calculate_weekly_trends(self, df):
        """Calculate consumption quantity per category per day of week"""
        df['day_of_week'] = df['consumption_date'].dt.day_name()
        trends = df.groupby(['day_of_week', 'category'])['quantity'].sum().unstack(fill_value=0)
        return trends.to_dict(orient='index')

    def _detect_over_consumption(self, df):
        """Detect categories with consumption > 2x average"""
        category_stats = df.groupby('category')['quantity'].agg(['mean', 'std']).reset_index()
        over_consumed = []
        
        for _, row in category_stats.iterrows():
            # Simple rule: if mean is high (placeholder logic, ideally compare to historical or peer data)
            # For now, let's look at recent spikes vs overall average
            recent_cutoff = df['consumption_date'].max() - timedelta(days=7)
            recent_avg = df[df['consumption_date'] > recent_cutoff].groupby('category')['quantity'].mean().get(row['category'], 0)
            
            if recent_avg > row['mean'] * 2:
                over_consumed.append({
                    'category': row['category'],
                    'avgQuantity': round(float(recent_avg), 2),
                    'typicalRange': f"{round(float(row['mean']), 2)} +/- {round(float(row['std']), 2)}"
                })
        return over_consumed

    def _detect_under_consumption(self, df):
        """Detect categories not consumed in last 14 days"""
        last_consumption = df.groupby('category')['consumption_date'].max()
        today = pd.Timestamp.now()
        under_consumed = []
        
        for category, last_date in last_consumption.items():
            days_since = (today - last_date).days
            if days_since > 14:
                under_consumed.append({
                    'category': category,
                    'daysSinceLastLog': days_since
                })
        return under_consumed

    def _predict_waste_risk(self, inventory_df, logs_df):
        """Identify items expiring soon with low consumption frequency"""
        if inventory_df.empty:
            return []
            
        today = pd.Timestamp.now()
        risk_items = []
        
        # Calculate consumption frequency (days between consumptions)
        consumption_freq = {}
        for category in logs_df['category'].unique():
            cat_logs = logs_df[logs_df['category'] == category].sort_values('consumption_date')
            if len(cat_logs) > 1:
                freq = cat_logs['consumption_date'].diff().mean().days
                consumption_freq[category] = freq
            else:
                consumption_freq[category] = 30 # Default to monthly if not enough data

        for _, item in inventory_df.iterrows():
            if pd.isna(item['expiration_date']):
                continue
                
            days_until_expiry = (item['expiration_date'] - today).days
            category_freq = consumption_freq.get(item['category'], 14)
            
            # Risk score calculation
            # High risk: Expires in < 3 days and consumption freq > days until expiry
            risk_score = 0
            reason = ""
            
            if days_until_expiry < 0:
                risk_score = 100
                reason = "Expired"
            elif days_until_expiry < 3:
                risk_score = 90
                reason = "Expires very soon"
            elif days_until_expiry < 7 and category_freq > days_until_expiry:
                risk_score = 75
                reason = "Low consumption rate relative to expiry"
            elif days_until_expiry < 7:
                risk_score = 50
                reason = "Expires soon"
                
            if risk_score > 0:
                risk_items.append({
                    'item': item['item_name'],
                    'riskScore': risk_score,
                    'reason': reason,
                    'daysUntilExpiry': days_until_expiry
                })
                
        return sorted(risk_items, key=lambda x: x['riskScore'], reverse=True)

    def _detect_imbalanced_patterns(self, df):
        """Detect imbalanced consumption patterns"""
        total_consumption = df['quantity'].sum()
        if total_consumption == 0:
            return []
            
        category_consumption = df.groupby('category')['quantity'].sum()
        imbalanced = []
        
        for category, quantity in category_consumption.items():
            percentage = (quantity / total_consumption) * 100
            
            if percentage > 40:
                imbalanced.append({
                    'category': category,
                    'status': 'high',
                    'recommendation': f"High consumption ({percentage:.1f}%). Consider reducing to balance diet."
                })
            elif percentage < 5:
                imbalanced.append({
                    'category': category,
                    'status': 'low',
                    'recommendation': f"Low consumption ({percentage:.1f}%). Consider increasing for variety."
                })
                
        return imbalanced

    def _generate_heatmap_data(self, df):
        """Matrix of [day_of_week][category] = quantity"""
        # Similar to weekly trends but formatted specifically for heatmap visualization if needed
        # For now, reusing weekly trends structure as it fits the requirement
        return self._calculate_weekly_trends(df)

    def _calculate_health_score(self, waste_risk, over_consumption):
        """Calculate a simple health score 0-100"""
        score = 100
        score -= len(waste_risk) * 5
        score -= len(over_consumption) * 5
        return max(0, score)


class WasteEstimator:
    def __init__(self, user_token):
        self.user_token = user_token
        self.base_url = os.getenv("BACKEND_BASE_URL")
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Accept": "application/json"
        }

    def fetch_inventory(self):
        """Fetch inventory items from backend"""
        items = []
        page = 1
        while True:
            response = requests.get(f"{self.base_url}/api/v1/inventory?page={page}&per_page=100", headers=self.headers)
            if response.status_code != 200:
                break
            
            data = response.json()
            if not data.get('success'):
                break
                
            items.extend(data.get('data', []))
            
            pagination = data.get('pagination', {})
            if page >= pagination.get('last_page', 1):
                break
            page += 1
        return items

    def estimate_waste(self, user):
        inventory_items = self.fetch_inventory()
        if not inventory_items:
            return None

        df = pd.DataFrame(inventory_items)
        
        # Filter for expired items
        # Assuming API returns 'is_expired' or we calculate it
        if 'is_expired' in df.columns:
            expired_df = df[df['is_expired'] == True]
        else:
            # Fallback calculation
            today = pd.Timestamp.now().strftime('%Y-%m-%d')
            expired_df = df[df['expiration_date'] < today]

        # Calculate current waste
        current_waste_grams = 0
        current_waste_cost = 0
        
        for _, item in expired_df.iterrows():
            quantity = float(item.get('quantity', 0))
            unit = item.get('unit', 'g')
            
            # Simple unit conversion to grams
            if unit in ['kg', 'l', 'liters']:
                quantity *= 1000
            elif unit in ['lb', 'lbs']:
                quantity *= 453.592
            
            current_waste_grams += quantity
            
            # Cost calculation (assuming cost_per_unit might be in food_item nested object)
            food_item = item.get('food_item', {})
            cost_per_unit = float(food_item.get('cost_per_unit', 0))
            current_waste_cost += quantity * cost_per_unit # This might need adjustment based on unit

        # Projections (Simple extrapolation)
        # Assuming current waste is for the last 30 days (rough estimate)
        weekly_waste_grams = (current_waste_grams / 30) * 7
        weekly_waste_cost = (current_waste_cost / 30) * 7
        
        monthly_waste_grams = current_waste_grams
        monthly_waste_cost = current_waste_cost
        
        projected_yearly_grams = monthly_waste_grams * 12
        projected_yearly_cost = monthly_waste_cost * 12

        # Save prediction
        from .models import WastePrediction
        prediction = WastePrediction.objects.create(
            user=user,
            weekly_waste_grams=weekly_waste_grams,
            weekly_waste_cost=weekly_waste_cost,
            monthly_waste_grams=monthly_waste_grams,
            monthly_waste_cost=monthly_waste_cost,
            projected_yearly_grams=projected_yearly_grams,
            projected_yearly_cost=projected_yearly_cost
        )
        
        return prediction


class NutrientAnalyzer:
    def __init__(self, user_token):
        self.user_token = user_token
        self.base_url = os.getenv("BACKEND_BASE_URL")
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Accept": "application/json"
        }
        
        # Dummy nutrient database (per 100g)
        self.nutrient_db = {
            'vegetables': {'vitamin_c': 20, 'fiber': 3, 'protein': 2},
            'fruits': {'vitamin_c': 30, 'fiber': 2, 'sugar': 10},
            'dairy': {'calcium': 120, 'protein': 3, 'fat': 3},
            'grains': {'fiber': 4, 'carbs': 20, 'protein': 4},
            'protein': {'protein': 20, 'iron': 2, 'fat': 5},
            'default': {'calories': 100}
        }
        
        # RDA (Recommended Daily Allowance)
        self.rda = {
            'vitamin_c': 90, # mg
            'fiber': 30, # g
            'protein': 50, # g
            'calcium': 1000, # mg
            'iron': 18 # mg
        }

    def fetch_consumption(self):
        """Fetch consumption logs"""
        items = []
        page = 1
        while True:
            response = requests.get(f"{self.base_url}/api/v1/consumption-logs?page={page}&per_page=100", headers=self.headers)
            if response.status_code != 200:
                break
            
            data = response.json()
            if not data.get('success'):
                break
                
            items.extend(data.get('data', []))
            
            pagination = data.get('pagination', {})
            if page >= pagination.get('last_page', 1):
                break
            page += 1
        return items

    def analyze_gaps(self, user):
        logs = self.fetch_consumption()
        if not logs:
            return None
            
        df = pd.DataFrame(logs)
        df['consumption_date'] = pd.to_datetime(df['consumption_date'])
        
        # Filter for last 7 days
        last_7_days = df[df['consumption_date'] >= (pd.Timestamp.now() - timedelta(days=7))]
        
        total_nutrients = {k: 0 for k in self.rda.keys()}
        
        for _, row in last_7_days.iterrows():
            category = row.get('category', 'default').lower()
            quantity = float(row.get('quantity', 0))
            unit = row.get('unit', 'g')
            
            # Convert to 100g units
            factor = 1
            if unit in ['kg', 'l']:
                factor = 10
            elif unit == 'g':
                factor = 0.01
            
            nutrients = self.nutrient_db.get(category, self.nutrient_db['default'])
            
            for nut, val in nutrients.items():
                if nut in total_nutrients:
                    total_nutrients[nut] += val * quantity * factor

        # Calculate gaps
        gaps = []
        daily_avg = {k: v / 7 for k, v in total_nutrients.items()}
        
        for nut, val in daily_avg.items():
            rda_val = self.rda.get(nut, 1)
            percentage = (val / rda_val) * 100
            
            if percentage < 70:
                gaps.append({
                    'nutrient': nut,
                    'consumed': round(val, 2),
                    'rda': rda_val,
                    'percentage': round(percentage, 1),
                    'severity': 'high' if percentage < 40 else 'moderate',
                    'recommendation': f"Increase intake of {nut}-rich foods."
                })
                
        return {
            'nutrient_levels': daily_avg,
            'deficiencies': gaps,
            'recommendations': self._generate_recommendations(gaps)
        }

    def _generate_recommendations(self, gaps):
        recs = []
        for gap in gaps:
            nut = gap['nutrient']
            if nut == 'vitamin_c':
                recs.append({'food': 'Oranges, Bell Peppers', 'nutrient': 'Vitamin C'})
            elif nut == 'fiber':
                recs.append({'food': 'Oats, Lentils', 'nutrient': 'Fiber'})
            elif nut == 'protein':
                recs.append({'food': 'Chicken, Tofu', 'nutrient': 'Protein'})
            elif nut == 'calcium':
                recs.append({'food': 'Milk, Yogurt', 'nutrient': 'Calcium'})
            elif nut == 'iron':
                recs.append({'food': 'Spinach, Red Meat', 'nutrient': 'Iron'})
        return recs


class MealOptimizer:
    def __init__(self, user_token):
        self.user_token = user_token
        self.base_url = os.getenv("BACKEND_BASE_URL")
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Accept": "application/json"
        }

    def fetch_user_profile(self):
        response = requests.get(f"{self.base_url}/api/v1/profile/", headers=self.headers)
        if response.status_code == 200:
            return response.json().get('data', {})
        return {}

    def fetch_inventory(self):
        """Fetch inventory items from backend"""
        items = []
        page = 1
        while True:
            response = requests.get(f"{self.base_url}/api/v1/inventory?page={page}&per_page=100", headers=self.headers)
            if response.status_code != 200:
                break
            
            data = response.json()
            if not data.get('success'):
                break
                
            items.extend(data.get('data', []))
            
            pagination = data.get('pagination', {})
            if page >= pagination.get('last_page', 1):
                break
            page += 1
        return items

    def optimize_plan(self, user, week_start_date, custom_preferences=None):
        profile = self.fetch_user_profile()
        inventory = self.fetch_inventory()
        
        # Parse budget (simple logic for now)
        budget_range = profile.get('budget_range', 'medium')
        budget_map = {'low': 2000, 'medium': 5000, 'high': 10000} # BDT per week
        budget = budget_map.get(budget_range, 5000)
        
        # Filter inventory for usable items (not expired)
        today = pd.Timestamp.now().strftime('%Y-%m-%d')
        usable_inventory = [item for item in inventory if item.get('expiration_date') >= today]
        
        # Generate Meal Plan (Rule-based for now, LLM placeholder)
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        meal_types = ['Breakfast', 'Lunch', 'Dinner']
        
        plan_data = []
        shopping_list = []
        total_cost = 0
        
        # Simple logic: Try to use inventory items first
        inventory_map = {item['item_name']: item for item in usable_inventory}
        
        for day in days:
            day_meals = []
            for m_type in meal_types:
                # Placeholder logic: Assign random meals or use inventory
                meal_name = f"{m_type} Meal"
                ingredients = []
                
                # Try to find an ingredient in inventory
                if inventory_map:
                    item_name = list(inventory_map.keys())[0]
                    item = inventory_map.pop(item_name)
                    ingredients.append({
                        'item': item_name,
                        'quantity': 1,
                        'unit': item.get('unit', 'pcs'),
                        'source': 'inventory'
                    })
                else:
                    # Need to buy
                    ing_name = "Rice" if m_type != 'Breakfast' else "Bread"
                    ingredients.append({
                        'item': ing_name,
                        'quantity': 0.5,
                        'unit': 'kg',
                        'source': 'purchase',
                        'estimatedCost': 50 # Dummy cost
                    })
                    shopping_list.append({
                        'item': ing_name,
                        'quantity': 0.5,
                        'estimatedCost': 50
                    })
                    total_cost += 50
                
                day_meals.append({
                    'type': m_type,
                    'name': meal_name,
                    'ingredients': ingredients
                })
            
            plan_data.append({
                'day': day,
                'meals': day_meals
            })
            
        # Save Meal Plan
        from .models import MealPlan
        meal_plan = MealPlan.objects.create(
            user=user,
            week_start_date=week_start_date,
            plan_data=plan_data,
            shopping_list=shopping_list,
            total_cost=total_cost,
            budget_remaining=budget - total_cost,
            nutrition_summary={"calories": 2000 * 7, "protein": 50 * 7} # Dummy summary
        )
        
        return meal_plan


class ImpactScorer:
    def __init__(self, user_token):
        self.user_token = user_token
        self.base_url = os.getenv("BACKEND_BASE_URL")
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Accept": "application/json"
        }

    def calculate_score(self, user):
        # Fetch data (mocking complex calculations for now)
        # In real implementation, would query PatternAnalysis, WasteLogs, etc.
        
        # 1. Waste Reduction Score (40%)
        # Compare user waste to community average (dummy)
        waste_score = 85 # Placeholder
        
        # 2. Nutrition Balance Score (30%)
        # Based on nutrient gap analysis
        nutrition_score = 70 # Placeholder
        
        # 3. Inventory Utilization (20%)
        utilization_score = 60 # Placeholder
        
        # 4. Sustainable Practices (10%)
        sustainable_score = 90 # Placeholder
        
        # Total Score
        overall_score = (
            (waste_score * 0.4) +
            (nutrition_score * 0.3) +
            (utilization_score * 0.2) +
            (sustainable_score * 0.1)
        )
        
        # Generate Insights
        insights = f"Great job! Your overall impact score is {overall_score}. You are doing well in waste reduction."
        
        action_steps = [
            {
                "title": "Reduce Meat Consumption",
                "description": "Try one meat-free day per week to improve your score.",
                "potentialImpact": "+5 points"
            },
            {
                "title": "Use Leftovers",
                "description": "You have 3 items expiring soon. Use them to boost utilization.",
                "potentialImpact": "+3 points"
            }
        ]
        
        # Save Score
        from .models import ImpactScore
        score = ImpactScore.objects.create(
            user=user,
            overall_score=overall_score,
            waste_reduction_score=waste_score,
            nutrition_balance_score=nutrition_score,
            inventory_utilization_score=utilization_score,
            sustainable_practices_score=sustainable_score,
            insights=insights,
            action_steps=action_steps
        )
        
        return score
