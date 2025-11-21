from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta


class UserBase(models.Model):
    user_id = models.CharField(max_length=8, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.name

class PatternAnalysis(models.Model):
    """Store analyzed consumption patterns"""
    user = models.ForeignKey(UserBase, on_delete=models.CASCADE, related_name='pattern_of_user')
    analysis_date = models.DateTimeField(auto_now_add=True)
    period_start = models.DateField()
    period_end = models.DateField()
    
    # JSON fields for storing complex analysis results
    weekly_trends = models.JSONField(
        default=dict,
        help_text="{ day_of_week: { category: quantity } }"
    )
    over_consumption = models.JSONField(
        default=list,
        help_text="[ { category, avgQuantity, typicalRange } ]"
    )
    under_consumption = models.JSONField(
        default=list,
        help_text="[ { category, daysSinceLastLog } ]"
    )
    waste_risk_items = models.JSONField(
        default=list,
        help_text="[ { item, riskScore, reason } ]"
    )
    imbalanced_patterns = models.JSONField(
        default=list,
        help_text="[ { category, status, recommendation } ]"
    )
    heatmap_data = models.JSONField(
        default=dict,
        help_text="Matrix for visualization [day][category] = quantity"
    )
    
    # Summary metrics
    total_categories_tracked = models.IntegerField(default=0)
    total_consumption_entries = models.IntegerField(default=0)
    waste_risk_count = models.IntegerField(default=0)
    health_score = models.FloatField(
        default=0,
        help_text="Overall consumption health score (0-100)"
    )
    
    class Meta:
        ordering = ['-analysis_date']
        verbose_name_plural = "Pattern Analyses"

    def __str__(self):
        return f"Analysis for {self.user.name} - {self.analysis_date.date()}"


class WasteLog(models.Model):
    """Track wasted items"""
    user = models.ForeignKey(UserBase, on_delete=models.CASCADE, related_name='waste_logs')
    inventory_item = models.CharField(max_length=200, null=True, blank=True)
    category = models.CharField(max_length=100)
    item_name = models.CharField(max_length=200)
    quantity = models.FloatField()
    unit = models.CharField(max_length=10, default='pcs')
    waste_date = models.DateField(default=timezone.now)
    reason = models.CharField(
        max_length=50,
        choices=[
            ('expired', 'Expired'),
            ('spoiled', 'Spoiled'),
            ('excess', 'Bought too much'),
            ('forgot', 'Forgot about it'),
            ('other', 'Other'),
        ]
    )
    estimated_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Estimated cost of wasted item"
    )
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-waste_date']
        indexes = [
            models.Index(fields=['user', 'waste_date']),
        ]

    def __str__(self):
        return f"Waste: {self.item_name} - {self.waste_date}"


class UserPreferences(models.Model):
    user = models.OneToOneField(UserBase, on_delete=models.CASCADE, related_name='preferences')
    
    # Analysis settings
    analysis_period_days = models.IntegerField(
        default=30,
        help_text="Number of days to analyze (30, 60, or 90)"
    )
    waste_alert_threshold = models.IntegerField(
        default=7,
        help_text="Alert when items expire within X days"
    )
    over_consumption_multiplier = models.FloatField(
        default=2.0,
        help_text="Flag consumption as high when > X times typical"
    )
    under_consumption_days = models.IntegerField(
        default=14,
        help_text="Flag categories not consumed in X days"
    )
    
    # Notification preferences
    enable_waste_alerts = models.BooleanField(default=True)
    enable_pattern_insights = models.BooleanField(default=True)
    enable_weekly_summary = models.BooleanField(default=True)
    
    # Display preferences
    preferred_units = models.CharField(
        max_length=10,
        choices=[('metric', 'Metric'), ('imperial', 'Imperial')],
        default='metric'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "User Preferences"

    def __str__(self):
        return f"Preferences for {self.user.name}"


class Recommendation(models.Model):
    """AI-generated recommendations"""
    user = models.ForeignKey(UserBase, on_delete=models.CASCADE, related_name='recommendations')
    pattern_analysis = models.ForeignKey(
        PatternAnalysis,
        on_delete=models.CASCADE,
        related_name='recommendations',
        null=True,
        blank=True
    )
    
    recommendation_type = models.CharField(
        max_length=50,
        choices=[
            ('reduce_waste', 'Reduce Waste'),
            ('balance_diet', 'Balance Diet'),
            ('shopping_list', 'Shopping List'),
            ('meal_planning', 'Meal Planning'),
            ('budget_optimization', 'Budget Optimization'),
        ]
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.IntegerField(
        default=1,
        help_text="1=Low, 2=Medium, 3=High"
    )
    is_read = models.BooleanField(default=False)
    is_dismissed = models.BooleanField(default=False)
    
    # Related data
    action_items = models.JSONField(
        default=list,
        help_text="Specific actions user can take"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When this recommendation becomes irrelevant"
    )

    class Meta:
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.title} for {self.user.name}"


class WastePrediction(models.Model):
    """Store waste predictions and projections"""
    user = models.ForeignKey(UserBase, on_delete=models.CASCADE, related_name='waste_predictions')
    prediction_date = models.DateField(auto_now_add=True)
    
    # Weekly projections
    weekly_waste_grams = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    weekly_waste_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Monthly projections
    monthly_waste_grams = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monthly_waste_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Yearly projections
    projected_yearly_grams = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    projected_yearly_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Waste Prediction for {self.user.name} - {self.prediction_date}"


class MealPlan(models.Model):
    """Weekly meal plan"""
    user = models.ForeignKey(UserBase, on_delete=models.CASCADE, related_name='meal_plans')
    week_start_date = models.DateField()
    
    # JSON fields
    plan_data = models.JSONField(
        default=list,
        help_text="[ { day, meals: [ { type, name, ingredients } ] } ]"
    )
    shopping_list = models.JSONField(
        default=list,
        help_text="[ { item, quantity, estimatedCost } ]"
    )
    
    # Financials
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    budget_remaining = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Nutrition
    nutrition_summary = models.JSONField(default=dict)
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-week_start_date']

    def __str__(self):
        return f"Meal Plan for {self.user.name} - Week of {self.week_start_date}"


class ImpactScore(models.Model):
    """User's sustainability impact score"""
    user = models.ForeignKey(UserBase, on_delete=models.CASCADE, related_name='impact_scores')
    score_date = models.DateField(auto_now_add=True)
    
    # Scores (0-100)
    overall_score = models.FloatField(default=0)
    waste_reduction_score = models.FloatField(default=0)
    nutrition_balance_score = models.FloatField(default=0)
    inventory_utilization_score = models.FloatField(default=0)
    sustainable_practices_score = models.FloatField(default=0)
    
    # Insights
    insights = models.TextField(blank=True)
    action_steps = models.JSONField(
        default=list,
        help_text="[ { title, description, potentialImpact } ]"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score_date']

    def __str__(self):
        return f"Impact Score for {self.user.name} - {self.score_date}: {self.overall_score}"