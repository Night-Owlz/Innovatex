'use client';

import { useState } from 'react';
import { Calendar, ChefHat, ShoppingCart, Download, RefreshCw, Clock, DollarSign, Leaf, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '@/lib/api';

export default function MealPlannerPage() {
  const [weekStartDate, setWeekStartDate] = useState(() => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    monday.setDate(diff);
    return monday.toISOString().split('T')[0];
  });
  
  const [customPreferences, setCustomPreferences] = useState('');
  const [loading, setLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [error, setError] = useState(null);
  const [expandedMeal, setExpandedMeal] = useState(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const mealTypes = ['breakfast', 'lunch', 'dinner'];

  const generateMealPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/ai/optimize-meal-plan', {
        weekStartDate,
        customPreferences: customPreferences || null,
      });
      
      setMealPlan(response.data);
    } catch (err) {
      console.error('Error generating meal plan:', err);
      setError(err.response?.data?.message || 'Failed to generate meal plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMealForDayAndType = (day, mealType) => {
    if (!mealPlan?.mealPlan) return null;
    return mealPlan.mealPlan.find(m => m.day === day && m.mealType === mealType);
  };

  const toggleMealExpanded = (day, mealType) => {
    const key = `${day}-${mealType}`;
    setExpandedMeal(expandedMeal === key ? null : key);
  };

  const handleExportPDF = () => {
    alert('PDF Export feature coming soon!');
  };

  const getSourceBadgeColor = (source) => {
    return source === 'inventory' 
      ? 'bg-green-500/20 text-green-500 border-green-500/30' 
      : 'bg-blue-500/20 text-blue-500 border-blue-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-lime-400 to-emerald-500 bg-clip-text text-transparent">
            Meal Planner
          </h1>
          <p className="text-muted-foreground mt-1">
            AI-optimized weekly meal planning with inventory management
          </p>
        </div>
        {mealPlan && (
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-lime-500 to-emerald-500 text-white rounded-lg hover:from-lime-600 hover:to-emerald-600 transition-all shadow-lg shadow-lime-500/20"
          >
            <Download className="h-4 w-4" />
            Export to PDF
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              Week Starting
            </label>
            <input
              type="date"
              value={weekStartDate}
              onChange={(e) => setWeekStartDate(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              <Leaf className="inline h-4 w-4 mr-1" />
              Custom Preferences (Optional)
            </label>
            <input
              type="text"
              value={customPreferences}
              onChange={(e) => setCustomPreferences(e.target.value)}
              placeholder="e.g., More protein, less carbs"
              disabled={loading}
              maxLength={500}
              className="w-full px-4 py-2 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={generateMealPlan}
            disabled={loading || !weekStartDate}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-lime-500 to-emerald-500 text-white rounded-lg hover:from-lime-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-lime-500/20"
          >
            {loading ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <ChefHat className="h-4 w-4" />
                Generate Meal Plan
              </>
            )}
          </button>

          {mealPlan && !loading && (
            <button
              onClick={generateMealPlan}
              className="flex items-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors border border-border"
            >
              <RefreshCw className="h-4 w-4" />
              Regenerate Plan
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <Clock className="h-5 w-5 text-blue-500 animate-spin" />
            <div>
              <p className="text-sm font-medium text-blue-500">Generating your optimized meal plan...</p>
              <p className="text-xs text-muted-foreground mt-1">This may take 5-10 seconds</p>
            </div>
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      )}

      {/* Meal Plan Grid & Shopping List */}
      {mealPlan && !loading && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Meal Calendar - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Nutrition Summary */}
            {mealPlan.nutritionSummary && (
              <div className="bg-card border rounded-lg p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-lime-500" />
                  Weekly Nutrition Summary
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-lime-500">{Math.round(mealPlan.nutritionSummary.calories)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Calories/day</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-500">{Math.round(mealPlan.nutritionSummary.protein)}g</p>
                    <p className="text-xs text-muted-foreground mt-1">Protein/day</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-500">{Math.round(mealPlan.nutritionSummary.carbs)}g</p>
                    <p className="text-xs text-muted-foreground mt-1">Carbs/day</p>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-500">{Math.round(mealPlan.nutritionSummary.fat)}g</p>
                    <p className="text-xs text-muted-foreground mt-1">Fat/day</p>
                  </div>
                </div>
              </div>
            )}

            {/* Calendar Grid */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[800px]">
                  {/* Header Row */}
                  <div className="grid grid-cols-8 border-b bg-muted/30">
                    <div className="p-3 font-semibold text-sm border-r">Meal</div>
                    {daysOfWeek.map(day => (
                      <div key={day} className="p-3 font-semibold text-sm text-center border-r last:border-r-0">
                        {day.slice(0, 3)}
                      </div>
                    ))}
                  </div>

                  {/* Meal Type Rows */}
                  {mealTypes.map(mealType => (
                    <div key={mealType} className="grid grid-cols-8 border-b last:border-b-0">
                      <div className="p-4 font-medium text-sm capitalize border-r bg-muted/20 flex items-center">
                        {mealType}
                      </div>
                      {daysOfWeek.map(day => {
                        const meal = getMealForDayAndType(day, mealType);
                        const isExpanded = expandedMeal === `${day}-${mealType}`;
                        
                        return (
                          <div key={`${day}-${mealType}`} className="border-r last:border-r-0 relative">
                            {meal ? (
                              <div className="h-full">
                                <button
                                  onClick={() => toggleMealExpanded(day, mealType)}
                                  className="w-full p-3 text-left hover:bg-muted/50 transition-colors h-full"
                                >
                                  <p className="text-sm font-medium line-clamp-2">{meal.mealName}</p>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-xs text-muted-foreground">
                                      {meal.ingredients.length} items
                                    </span>
                                    {isExpanded ? (
                                      <ChevronUp className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </div>
                                </button>
                                
                                {/* Expanded Ingredients */}
                                {isExpanded && (
                                  <div className="absolute z-10 left-0 right-0 top-full bg-card border border-lime-500/50 rounded-b-lg shadow-xl p-4 min-w-[300px]">
                                    <div className="flex items-center justify-between mb-3">
                                      <h4 className="font-semibold text-sm">{meal.mealName}</h4>
                                      <button
                                        onClick={() => setExpandedMeal(null)}
                                        className="p-1 hover:bg-muted rounded"
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <div className="space-y-2">
                                      <p className="text-xs font-medium text-muted-foreground uppercase">Ingredients:</p>
                                      {meal.ingredients.map((ingredient, idx) => (
                                        <div key={idx} className="flex items-start justify-between gap-2 text-sm pb-2 border-b last:border-b-0">
                                          <div className="flex-1">
                                            <p className="font-medium">{ingredient.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                              {ingredient.quantity} {ingredient.unit}
                                            </p>
                                          </div>
                                          <span className={`text-xs px-2 py-1 rounded-full border ${getSourceBadgeColor(ingredient.source)}`}>
                                            {ingredient.source === 'inventory' ? '🏠 Stock' : '🛒 Buy'}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                    {meal.nutrition && (
                                      <div className="mt-3 pt-3 border-t">
                                        <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Nutrition:</p>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                          <div>Calories: <span className="font-medium">{Math.round(meal.nutrition.calories)}</span></div>
                                          <div>Protein: <span className="font-medium">{Math.round(meal.nutrition.protein)}g</span></div>
                                          <div>Carbs: <span className="font-medium">{Math.round(meal.nutrition.carbs)}g</span></div>
                                          <div>Fat: <span className="font-medium">{Math.round(meal.nutrition.fat)}g</span></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="p-3 h-full flex items-center justify-center">
                                <p className="text-xs text-muted-foreground">No meal</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Shopping List Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card border rounded-lg p-6 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">Shopping List</h3>
              </div>

              {/* Budget Summary */}
              <div className="bg-gradient-to-br from-lime-500/10 to-emerald-500/10 border border-lime-500/30 rounded-lg p-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Weekly Budget:</span>
                    <span className="font-semibold">${mealPlan.weeklyBudget?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Cost:</span>
                    <span className="font-semibold text-blue-500">${mealPlan.totalCost?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="h-px bg-border my-2"></div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Remaining:</span>
                    <span className={`font-bold text-lg ${
                      mealPlan.budgetRemaining >= 0 ? 'text-lime-500' : 'text-red-500'
                    }`}>
                      ${mealPlan.budgetRemaining?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shopping Items */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {mealPlan.shoppingList && mealPlan.shoppingList.length > 0 ? (
                  mealPlan.shoppingList.map((item, idx) => (
                    <div key={idx} className="p-3 bg-muted/30 rounded-lg border border-border hover:border-blue-500/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {item.quantity} {item.unit}
                          </p>
                          {item.category && (
                            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-500 capitalize">
                              {item.category}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm text-blue-500">
                            ${item.estimatedCost?.toFixed(2) || '0.00'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">
                      All meals use inventory items!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!mealPlan && !loading && !error && (
        <div className="text-center py-16">
          <ChefHat className="h-20 w-20 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Meal Plan Generated</h3>
          <p className="text-muted-foreground mb-6">
            Select a week and click &quot;Generate Meal Plan&quot; to get started with AI-optimized meal planning
          </p>
        </div>
      )}
    </div>
  );
}
