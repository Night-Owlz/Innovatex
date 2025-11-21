import pandas as pd
import requests
import os
import json
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

    def estimate_waste(self, user, start_date=None, end_date=None):
        inventory_items = self.fetch_inventory()
        if not inventory_items:
            return None

        df = pd.DataFrame(inventory_items)
        
        # Filter for expired items
        if 'is_expired' in df.columns:
            expired_df = df[df['is_expired'] == True]
        else:
            today = pd.Timestamp.now().strftime('%Y-%m-%d')
            expired_df = df[df['expiration_date'] < today]

        # Filter by date range if provided
        if start_date:
            expired_df = expired_df[expired_df['expiration_date'] >= start_date]
        if end_date:
            expired_df = expired_df[expired_df['expiration_date'] <= end_date]

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
            
            # Cost calculation
            food_item = item.get('food_item')
            if food_item:
                cost_per_unit = float(food_item.get('cost_per_unit', 0))
                current_waste_cost += quantity * cost_per_unit

        # Projections
        weekly_waste_grams = (current_waste_grams / 30) * 7
        weekly_waste_cost = (current_waste_cost / 30) * 7
        
        monthly_waste_grams = current_waste_grams
        monthly_waste_cost = current_waste_cost
        
        projected_yearly_grams = monthly_waste_grams * 12
        projected_yearly_cost = monthly_waste_cost * 12

        # Community Comparison - Load from JSON
        import json
        from django.conf import settings
        
        try:
            json_path = os.path.join(settings.BASE_DIR, 'mainapp', 'data', 'community_waste_data.json')
            with open(json_path, 'r') as f:
                community_avg = json.load(f)
        except Exception as e:
            print(f"Error loading community data: {e}")
            community_avg = {"Global": {"weekly_grams": 300, "weekly_cost": 450}}
        
        user_location = "Dhaka Cantonment"
        location_avg = community_avg.get(user_location, community_avg.get("Global", {"weekly_grams": 300, "weekly_cost": 450}))
        
        comparison = {
            "user_location": user_location,
            "community_average": location_avg,
            "comparison_status": "better" if weekly_waste_grams < location_avg["weekly_grams"] else "worse",
            "difference_grams": weekly_waste_grams - location_avg["weekly_grams"],
            "difference_cost": weekly_waste_cost - location_avg["weekly_cost"]
        }

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
        
        return {
            "prediction": prediction,
            "comparison": comparison,
            "date_range": {"start": start_date, "end": end_date}
        }


class NutrientAnalyzer:
    def __init__(self, user_token):
        self.user_token = user_token
        self.base_url = os.getenv("BACKEND_BASE_URL")
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Accept": "application/json"
        }
        
        # Load nutrition data
        self.nutrition_data = self._load_nutrition_data()
        self.rda = self.nutrition_data.get('daily_requirements', {})
        self.food_db = self.nutrition_data.get('meal_nutrition', {})

    def _load_nutrition_data(self):
        try:
            from django.conf import settings
            json_path = os.path.join(settings.BASE_DIR, 'mainapp', 'data', 'nutrition_data.json')
            with open(json_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading nutrition data: {e}")
            return {'daily_requirements': {}, 'meal_nutrition': {}}

    def fetch_consumption(self):
        """Fetch consumption logs"""
        items = []
        page = 1
        while True:
            try:
                response = requests.get(f"{self.base_url}/api/v1/consumption-logs?page={page}&per_page=100", headers=self.headers, timeout=5)
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
            except:
                break
        return items

    def analyze_gaps(self, user):
        logs = self.fetch_consumption()
        if not logs:
            return None
            
        df = pd.DataFrame(logs)
        if 'consumption_date' in df.columns:
            df['consumption_date'] = pd.to_datetime(df['consumption_date'])
        else:
            return None
        
        # Filter for last 7 days
        last_7_days = df[df['consumption_date'] >= (pd.Timestamp.now() - timedelta(days=7))]
        
        total_nutrients = {k: 0 for k in self.rda.keys()}
        
        for _, row in last_7_days.iterrows():
            food_item = row.get('food_item_name', '') # Assuming food name is available
            if not food_item:
                category = row.get('category', '')
                # Fallback to category mapping if specific item not found
                food_item = category.capitalize()

            quantity = float(row.get('quantity', 0))
            unit = row.get('unit', 'g')
            
            # Normalize to 100g
            factor = 1
            if unit in ['kg', 'l']:
                factor = 10
            elif unit == 'g':
                factor = 0.01
            
            # Look up nutrient info
            # Try exact match first, then partial
            nutrients = {}
            for db_item, db_nuts in self.food_db.items():
                if db_item.lower() in food_item.lower() or food_item.lower() in db_item.lower():
                    nutrients = db_nuts
                    break
            
            if not nutrients:
                # Fallback to category defaults if available
                pass 

            for nut, val in nutrients.items():
                if nut in total_nutrients:
                    total_nutrients[nut] += val * quantity * factor

        # Calculate gaps
        gaps = []
        daily_avg = {k: v / 7 for k, v in total_nutrients.items()}
        
        for nut, val in daily_avg.items():
            rda_val = self.rda.get(nut, 1)
            percentage = (val / rda_val) * 100
            
            if percentage < 80: # Threshold for gap
                gaps.append({
                    'nutrient': nut,
                    'consumed': round(val, 2),
                    'rda': rda_val,
                    'percentage': round(percentage, 1),
                    'severity': 'high' if percentage < 50 else 'moderate',
                    'recommendation': f"Increase intake of {nut}-rich foods."
                })
                
        # Predict future deficiencies
        predictions = self._predict_deficiencies(df)
        
        # Generate AI suggestions
        suggestions = self._generate_ai_suggestions(gaps, predictions)

        return {
            'nutrient_levels': daily_avg,
            'deficiencies': gaps,
            'predictions': predictions,
            'suggestions': suggestions
        }

    def _predict_deficiencies(self, df):
        """Predict likely future deficiencies based on trends"""
        if df.empty:
            return []
            
        # Group by week to see trends
        df['week'] = df['consumption_date'].dt.isocalendar().week
        weekly_counts = df.groupby('week').size()
        
        if len(weekly_counts) < 2:
            return [] # Not enough data for trend
            
        # Simple trend analysis: if consumption of a nutrient category is decreasing
        # This is a placeholder for more complex time-series analysis
        predictions = []
        
        # Example heuristic: Check if fruit/veg consumption is dropping
        # In real app, would map food items to nutrient categories
        
        return predictions

    def _generate_ai_suggestions(self, gaps, predictions):
        """Use Gemini to suggest foods/meals"""
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return self._generate_static_suggestions(gaps)
            
            gap_text = ", ".join([f"{g['nutrient']} ({g['percentage']}%)" for g in gaps])
            
            url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key={api_key}"
            
            prompt = f"""You are a nutritionist. The user has these nutrient gaps: {gap_text}.
            
            Suggest 3 specific meals or foods to fill these gaps.
            For each suggestion, explain WHY it helps.
            
            Output JSON:
            [
                {{
                    "food": "Name of food/meal",
                    "reason": "Explanation",
                    "nutrients": ["List", "of", "nutrients"]
                }}
            ]
            """
            
            payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.7}}
            response = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                text = result['candidates'][0]['content']['parts'][0]['text'].strip()
                if text.startswith("```json"): text = text[7:]
                if text.endswith("```"): text = text[:-3]
                return json.loads(text.strip())
            else:
                return self._generate_static_suggestions(gaps)
        except:
            return self._generate_static_suggestions(gaps)

    def _generate_static_suggestions(self, gaps):
        suggestions = []
        for gap in gaps:
            suggestions.append({
                "food": f"Foods rich in {gap['nutrient']}",
                "reason": f"You are low on {gap['nutrient']}",
                "nutrients": [gap['nutrient']]
            })
        return suggestions
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
        
        # Load local food prices and nutrition data
        import json
        from django.conf import settings
        from collections import defaultdict
        
        try:
            prices_path = os.path.join(settings.BASE_DIR, 'mainapp', 'data', 'local_food_prices.json')
            with open(prices_path, 'r') as f:
                local_prices = json.load(f)
        except Exception as e:
            print(f"Error loading local prices: {e}")
            local_prices = {}
            
        try:
            nutrition_path = os.path.join(settings.BASE_DIR, 'mainapp', 'data', 'nutrition_data.json')
            with open(nutrition_path, 'r') as f:
                nutrition_db = json.load(f)
        except Exception as e:
            print(f"Error loading nutrition data: {e}")
            nutrition_db = {"daily_requirements": {}, "meal_nutrition": {}}

        # Parse budget
        budget_range = profile.get('budget_range', 'medium')
        budget_map = {'low': 2000, 'medium': 5000, 'high': 10000} # BDT per week
        budget = budget_map.get(budget_range, 5000)
        
        # Filter and sort inventory (prioritize expiring soon)
        today = pd.Timestamp.now().strftime('%Y-%m-%d')
        usable_inventory = [item for item in inventory if item.get('expiration_date') >= today]
        usable_inventory.sort(key=lambda x: x.get('expiration_date', '9999-12-31'))
        
        days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        meal_types = ['Breakfast', 'Lunch', 'Dinner']
        
        plan_data = []
        shopping_dict = defaultdict(lambda: {'quantity': 0, 'cost': 0, 'unit': 'kg'})
        total_cost = 0
        weekly_nutrition = defaultdict(float)
        
        # Helper functions
        def get_price_info(item_name):
            info = local_prices.get(item_name, {})
            return info.get('price', 100), info.get('unit', 'unit'), info.get('category', 'General')

        def get_nutrition_info(item_name, quantity=1):
            nutrition = nutrition_db.get('meal_nutrition', {}).get(item_name, {})
            return {k: v * quantity for k, v in nutrition.items()}

        def find_alternative(item_name, category):
            current_price, _, _ = get_price_info(item_name)
            alternatives = [(name, info['price']) for name, info in local_prices.items() 
                          if info['category'] == category and info['price'] < current_price]
            return sorted(alternatives, key=lambda x: x[1])[0][0] if alternatives else None

        inventory_map = {item['item_name']: item for item in usable_inventory}
        
        # Meal templates for variety
        meal_templates = {
            'Breakfast': [
                {'base': 'Bread', 'protein': 'Eggs', 'fruit': 'Bananas'},
                {'base': 'Milk', 'grain': 'Bread', 'fruit': 'Apples'},
            ],
            'Lunch': [
                {'base': 'Rice', 'protein': 'Lentils', 'veg': 'Spinach'},
                {'base': 'Rice', 'protein': 'Fish (Tilapia)', 'veg': 'Potatoes'},
            ],
            'Dinner': [
                {'base': 'Rice', 'protein': 'Chicken', 'veg': 'Onions'},
                {'base': 'Rice', 'protein': 'Beef', 'veg': 'Potatoes'},
                {'base': 'Rice', 'protein': 'Fish (Ruhi)', 'veg': 'Spinach'},
            ]
        }
        
        for day_idx, day in enumerate(days):
            day_meals = []
            for m_type in meal_types:
                ingredients = []
                alternatives_suggested = []
                meal_nutrition = defaultdict(float)
                
                # Select meal template (rotate for variety)
                template_idx = day_idx % len(meal_templates[m_type])
                template = meal_templates[m_type][template_idx]
                
                # Try to use inventory first
                for component, item_name in template.items():
                    qty = 0.15 if component == 'protein' else 0.1  # kg
                    
                    # Check if item in inventory
                    if item_name in inventory_map:
                        item = inventory_map.pop(item_name)
                        ingredients.append({
                            'item': item_name,
                            'quantity': qty,
                            'unit': 'kg',
                            'source': 'inventory'
                        })
                    else:
                        # Need to purchase
                        price, unit, category = get_price_info(item_name)
                        
                        # Check for cheaper alternative
                        alt_item = find_alternative(item_name, category)
                        final_item = alt_item if alt_item and (total_cost / budget) > 0.6 else item_name
                        
                        if alt_item and final_item == alt_item:
                            alternatives_suggested.append(f"Using {alt_item} instead of {item_name} to save cost")
                        
                        final_price, final_unit, _ = get_price_info(final_item)
                        meal_cost = final_price * qty
                        
                        ingredients.append({
                            'item': final_item,
                            'quantity': qty,
                            'unit': final_unit,
                            'source': 'purchase',
                            'estimatedCost': round(meal_cost, 2)
                        })
                        
                        # Add to shopping list
                        shopping_dict[final_item]['quantity'] += qty
                        shopping_dict[final_item]['cost'] += meal_cost
                        shopping_dict[final_item]['unit'] = final_unit
                        total_cost += meal_cost
                    
                    # Track nutrition
                    item_nutrition = get_nutrition_info(item_name, qty)
                    for nutrient, value in item_nutrition.items():
                        meal_nutrition[nutrient] += value
                        weekly_nutrition[nutrient] += value
                
                day_meals.append({
                    'type': m_type,
                    'name': f"{m_type} - {', '.join(template.values())}",
                    'ingredients': ingredients,
                    'alternatives': alternatives_suggested,
                    'nutrition': dict(meal_nutrition)
                })
            
            plan_data.append({
                'day': day,
                'meals': day_meals
            })
        
        # Convert shopping dict to list
        shopping_list = [
            {
                'item': item,
                'quantity': round(data['quantity'], 2),
                'unit': data['unit'],
                'estimatedCost': round(data['cost'], 2)
            }
            for item, data in shopping_dict.items()
        ]
        
        # Calculate nutrition summary
        daily_requirements = nutrition_db.get('daily_requirements', {})
        nutrition_summary = {
            'weekly_totals': {k: round(v, 2) for k, v in weekly_nutrition.items()},
            'daily_average': {k: round(v/7, 2) for k, v in weekly_nutrition.items()},
            'requirements_met': {
                nutrient: round((weekly_nutrition.get(nutrient, 0) / 7) / req * 100, 1)
                for nutrient, req in daily_requirements.items()
            }
        }
        
        # LLM Optimization (Placeholder)
        plan_data = self._optimize_with_llm(plan_data, user, budget - total_cost)

        # Save Meal Plan
        from .models import MealPlan
        meal_plan = MealPlan.objects.create(
            user=user,
            week_start_date=week_start_date,
            plan_data=plan_data,
            shopping_list=shopping_list,
            total_cost=round(total_cost, 2),
            budget_remaining=round(budget - total_cost, 2),
            nutrition_summary=nutrition_summary
        )
        
        return meal_plan

    def _optimize_with_llm(self, plan_data, user, remaining_budget):
        """
        Use Gemini LLM via REST API to optimize meal plan for variety, nutrition, and cost-effectiveness.
        Lightweight implementation using requests library only.
        """
        try:
            import json
            
            # Get API key
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                print("Warning: GEMINI_API_KEY not found, skipping LLM optimization")
                return plan_data
            
            # Gemini REST API endpoint (using lightweight flash-lite model)
            url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key={api_key}"
            
            # Prepare prompt
            prompt = f"""You are a nutrition and meal planning expert in Bangladesh. Optimize this weekly meal plan.

**Current Meal Plan:**
{json.dumps(plan_data, indent=2)}

**Budget Remaining:** {remaining_budget} BDT

**Optimization Goals:**
1. **Minimize Waste**: Prioritize using inventory items (marked as 'source': 'inventory')
2. **Maximize Nutrition**: Ensure balanced macros (protein, carbs, fiber) and micronutrients
3. **Ensure Variety**: Avoid repetitive meals, suggest diverse Bangladeshi dishes
4. **Stay Within Budget**: Keep total cost under budget, suggest local affordable alternatives
5. **Cultural Relevance**: Use locally available ingredients and traditional Bangladeshi recipes

**Requirements:**
- Keep the same 7-day structure with Breakfast, Lunch, Dinner
- Maintain or improve nutrition values
- Suggest specific dish names (e.g., "Dal Bhaat", "Chicken Curry", "Paratha with Egg")
- If swapping ingredients, explain why (cost/nutrition/variety)
- Ensure meals are practical and easy to prepare

**Output Format (JSON):**
Return the optimized plan_data in the EXACT same structure, with:
- Improved meal names (specific dishes instead of generic)
- Better ingredient combinations
- Updated 'alternatives' array with reasoning
- Enhanced 'nutrition' values if possible

Return ONLY valid JSON, no markdown formatting or explanations outside the JSON.
"""

            # Request payload
            payload = {
                "contents": [{
                    "parts": [{
                        "text": prompt
                    }]
                }],
                "generationConfig": {
                    "temperature": 0.7,
                    "maxOutputTokens": 8000,
                }
            }
            
            # Call Gemini API
            response = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=60  # Increased timeout for LLM processing
            )
            
            if response.status_code != 200:
                print(f"Warning: Gemini API error {response.status_code}: {response.text}")
                return plan_data
            
            # Parse response
            result = response.json()
            if 'candidates' not in result or len(result['candidates']) == 0:
                print("Warning: No response from Gemini")
                return plan_data
            
            response_text = result['candidates'][0]['content']['parts'][0]['text'].strip()
            
            # Clean response (remove markdown code blocks if present)
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            if response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse LLM response
            try:
                optimized_plan = json.loads(response_text)
                print("✅ LLM optimization successful")
                return optimized_plan
            except json.JSONDecodeError as e:
                print(f"Warning: LLM response not valid JSON: {e}")
                print(f"Response preview: {response_text[:200]}")
                return plan_data
                
        except requests.exceptions.Timeout:
            print("Warning: Gemini API timeout")
            return plan_data
        except Exception as e:
            print(f"Warning: LLM optimization failed: {e}")
            return plan_data




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


class SDGScorer:
    """
    UN Sustainable Development Goals (SDG) Scoring Engine
    Focuses on SDG 2 (Zero Hunger), SDG 3 (Good Health), SDG 12 (Responsible Consumption)
    """
    def __init__(self, user_token):
        self.user_token = user_token
        self.base_url = os.getenv("BACKEND_BASE_URL")
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Accept": "application/json"
        }
    
    def fetch_user_data(self):
        """Fetch comprehensive user data for SDG scoring"""
        try:
            waste_response = requests.get(f"{self.base_url}/api/waste-predictions/", headers=self.headers, timeout=10)
            waste_data = waste_response.json() if waste_response.status_code == 200 else []
            
            nutrient_response = requests.get(f"{self.base_url}/api/nutrient-analyses/", headers=self.headers, timeout=10)
            nutrient_data = nutrient_response.json() if nutrient_response.status_code == 200 else []
            
            meal_response = requests.get(f"{self.base_url}/api/meal-plans/", headers=self.headers, timeout=10)
            meal_data = meal_response.json() if meal_response.status_code == 200 else []
            
            return {'waste': waste_data, 'nutrients': nutrient_data, 'meals': meal_data}
        except Exception as e:
            print(f"Error fetching SDG data: {e}")
            return {'waste': [], 'nutrients': [], 'meals': []}
    
    def calculate_sdg_2_score(self, nutrient_data):
        """SDG 2: Zero Hunger - Nutrition Adequacy Score"""
        if not nutrient_data:
            return 50
        
        latest = nutrient_data[0] if isinstance(nutrient_data, list) else nutrient_data
        deficiencies = latest.get('deficiencies', [])
        
        if not deficiencies:
            return 100
        
        total_percentage = sum(d.get('percentage', 0) for d in deficiencies)
        avg_percentage = total_percentage / len(deficiencies) if deficiencies else 0
        
        if avg_percentage >= 90:
            return 95
        elif avg_percentage >= 75:
            return 85
        elif avg_percentage >= 60:
            return 70
        else:
            return max(30, avg_percentage)
    
    def calculate_sdg_12_score(self, waste_data):
        """SDG 12: Responsible Consumption - Waste Reduction"""
        if not waste_data:
            return 50
        
        latest = waste_data[0] if isinstance(waste_data, list) else waste_data
        weekly_waste = float(latest.get('weekly_waste_grams', 0))
        community_avg = 400
        
        if weekly_waste == 0:
            reduction_pct = 100
        else:
            reduction_pct = max(0, ((community_avg - weekly_waste) / community_avg) * 100)
        
        if reduction_pct >= 75:
            return 100
        elif reduction_pct >= 50:
            return 90
        elif reduction_pct >= 25:
            return 75
        else:
            return max(30, 60 + reduction_pct * 0.4)
    
    def generate_sdg_insights(self, scores):
        """Generate AI-powered SDG insights"""
        try:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                return self._generate_rule_based_insights(scores)
            
            url = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-lite:generateContent?key={api_key}"
            
            prompt = f"""You are a UN SDG expert. Analyze this user's progress:

SDG Scores:
- Overall: {scores['overall']:.1f}/100
- SDG 2 (Zero Hunger): {scores['sdg_2']:.1f}/100
- SDG 12 (Responsible Consumption): {scores['sdg_12']:.1f}/100

Generate JSON:
{{
  "weekly_insight": "2-3 sentences about SDG impact",
  "celebration_message": "Brief motivational message",
  "action_steps": [
    {{
      "title": "Action",
      "description": "SDG-aligned step",
      "potentialImpact": "+X points",
      "sdg_target": "SDG 2.1 or SDG 12.3",
      "category": "nutrition|waste|sustainable"
    }}
  ]
}}

Return ONLY JSON."""

            payload = {"contents": [{"parts": [{"text": prompt}]}], "generationConfig": {"temperature": 0.8, "maxOutputTokens": 800}}
            response = requests.post(url, headers={"Content-Type": "application/json"}, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                response_text = result['candidates'][0]['content']['parts'][0]['text'].strip()
                
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                response_text = response_text.strip()
                
                insights = json.loads(response_text)
                print("✅ SDG AI insights generated")
                return insights
            else:
                return self._generate_rule_based_insights(scores)
        except Exception as e:
            print(f"SDG AI failed: {e}")
            return self._generate_rule_based_insights(scores)
    
    def _generate_rule_based_insights(self, scores):
        """Fallback SDG insights"""
        overall = scores['overall']
        
        if overall >= 80:
            insight = f"Outstanding! Your SDG score of {overall:.1f} shows strong commitment to global sustainability goals."
            celebration = "🌟 You're an SDG Champion!"
        elif overall >= 60:
            insight = f"Good progress! Your SDG score of {overall:.1f} contributes to a sustainable future."
            celebration = "🌱 Making a difference!"
        else:
            insight = f"Every action counts! Your SDG score of {overall:.1f} can improve with small changes."
            celebration = "💪 Keep going!"
        
        action_steps = []
        
        if scores['sdg_2'] < 70:
            action_steps.append({
                "title": "Improve Nutrition",
                "description": "Increase fruits and vegetables to meet SDG 2 (Zero Hunger) targets.",
                "potentialImpact": "+12 points",
                "sdg_target": "SDG 2.1 - End hunger",
                "category": "nutrition"
            })
        
        if scores['sdg_12'] < 70:
            action_steps.append({
                "title": "Reduce Food Waste",
                "description": "Plan meals to support SDG 12 (Responsible Consumption).",
                "potentialImpact": "+15 points",
                "sdg_target": "SDG 12.3 - Halve food waste",
                "category": "waste"
            })
        
        action_steps.append({
            "title": "Choose Sustainable Foods",
            "description": "Buy local, seasonal produce for SDG 12.",
            "potentialImpact": "+8 points",
            "sdg_target": "SDG 12.8 - Sustainable lifestyles",
            "category": "sustainable"
        })
        
        return {
            "weekly_insight": insight,
            "celebration_message": celebration,
            "action_steps": action_steps[:3]
        }
    
    def calculate_sdg_score(self, user, week_start_date):
        """Main SDG scoring function"""
        from datetime import datetime
        from .models import SDGScore
        
        if isinstance(week_start_date, str):
            week_start_date = datetime.strptime(week_start_date, '%Y-%m-%d').date()
        
        user_data = self.fetch_user_data()
        
        sdg_2_score = self.calculate_sdg_2_score(user_data['nutrients'])
        sdg_12_score = self.calculate_sdg_12_score(user_data['waste'])
        
        overall_sdg_score = (sdg_2_score * 0.5) + (sdg_12_score * 0.5)
        
        scores = {
            'overall': overall_sdg_score,
            'sdg_2': sdg_2_score,
            'sdg_12': sdg_12_score
        }
        
        ai_insights = self.generate_sdg_insights(scores)
        
        # Use update_or_create to avoid unique constraint errors
        sdg_score, created = SDGScore.objects.update_or_create(
            user=user,
            week_start_date=week_start_date,
            defaults={
                'overall_sdg_score': round(overall_sdg_score, 1),
                'sdg_2_score': round(sdg_2_score, 1),
                'sdg_3_score': 70.0,  # Placeholder
                'sdg_12_score': round(sdg_12_score, 1),
                'waste_reduction_percentage': 0,
                'nutrition_improvement_percentage': 0,
                'carbon_footprint_score': 70.0,
                'weekly_insight': ai_insights.get('weekly_insight', ''),
                'celebration_message': ai_insights.get('celebration_message', ''),
                'action_steps': ai_insights.get('action_steps', []),
                'week_over_week_change': 0,
                'trend': 'stable'
            }
        )
        
        return sdg_score


class InventoryRiskAnalyzer:
    def __init__(self, user_token):
        self.user_token = user_token
        self.base_url = os.getenv("BACKEND_BASE_URL")
        self.headers = {
            "Authorization": f"Bearer {self.user_token}",
            "Accept": "application/json"
        }

    def fetch_inventory(self):
        try:
            response = requests.get(f"{self.base_url}/api/inventory/", headers=self.headers, timeout=10)
            return response.json() if response.status_code == 200 else []
        except:
            return []

    def fetch_consumption_history(self):
        # Fetch last 30 days logs to determine frequency
        try:
            response = requests.get(f"{self.base_url}/api/v1/consumption-logs?per_page=100", headers=self.headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                return data.get('data', [])
            return []
        except:
            return []

    def get_season_factor(self):
        """Return risk multiplier based on season (Warm = higher spoilage risk)"""
        month = datetime.now().month
        # Northern Hemisphere approximation
        if 5 <= month <= 9: # May-Sep (Warm)
            return 1.5
        return 1.0

    def calculate_consumption_frequency(self, item_name, logs):
        """Calculate how often an item is consumed (times per week)"""
        if not logs:
            return 0
        
        count = sum(1 for log in logs if item_name.lower() in log.get('food_item_name', '').lower())
        # Assuming logs are roughly last 30 days
        return count / 4.0 # Weekly frequency

    def analyze_risk(self):
        inventory = self.fetch_inventory()
        logs = self.fetch_consumption_history()
        season_factor = self.get_season_factor()
        
        analyzed_items = []
        alerts = []
        
        for item in inventory:
            name = item.get('name', 'Unknown')
            category = item.get('category', 'other').lower()
            expiry_date_str = item.get('expiration_date')
            
            # 1. Calculate Days Until Expiry
            if expiry_date_str:
                try:
                    expiry_date = datetime.strptime(expiry_date_str, '%Y-%m-%d').date()
                    days_until_expiry = (expiry_date - datetime.now().date()).days
                except:
                    days_until_expiry = 30
            else:
                # Estimate based on category if no date
                days_until_expiry = 7 if category in ['vegetables', 'fruits', 'dairy'] else 30
            
            # 2. Apply Seasonality Rules (Dummy Rules)
            # Fruits/Veg expire faster in warm seasons
            if category in ['fruits', 'vegetables', 'dairy'] and season_factor > 1.0:
                effective_days = days_until_expiry / season_factor
            else:
                effective_days = days_until_expiry
                
            # 3. Consumption Frequency
            freq = self.calculate_consumption_frequency(name, logs)
            
            # 4. AI Priority Score (0-100)
            # Higher score = Higher Priority to consume
            # Factors: Urgency (Expiry), Usage (Freq)
            
            # Urgency Score: 100 if expiring today, 0 if > 14 days
            urgency_score = max(0, 100 - (effective_days * 7))
            
            # Usage Score: If we use it often, we should prioritize it less (natural consumption)
            # If we rarely use it and it's expiring, we need a nudge!
            usage_factor = 1.0 if freq > 2 else 1.5 
            
            final_score = min(100, urgency_score * usage_factor)
            
            risk_level = 'Low'
            if final_score > 80:
                risk_level = 'Critical'
                alerts.append(f"Consume {name} immediately! High spoilage risk.")
            elif final_score > 50:
                risk_level = 'High'
                alerts.append(f"Plan to use {name} soon.")
            elif final_score > 30:
                risk_level = 'Medium'
            
            analyzed_items.append({
                'item': name,
                'category': category,
                'days_until_expiry': round(effective_days, 1),
                'consumption_freq_per_week': round(freq, 1),
                'priority_score': round(final_score, 1),
                'risk_level': risk_level,
                'season_impact': 'High' if season_factor > 1.0 and category in ['fruits', 'vegetables'] else 'Normal'
            })
            
        # Sort by Priority (FIFO + AI Score)
        analyzed_items.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return {
            'analyzed_inventory': analyzed_items,
            'alerts': alerts,
            'meta': {
                'season_factor': season_factor,
                'total_items': len(inventory)
            }
        }
