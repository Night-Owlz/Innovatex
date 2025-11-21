# 🍎 Nutrient Gap Prediction & AI Suggestions

## Overview
The Nutrient Gap Prediction feature analyzes a user's consumption history to identify current nutrient deficiencies, predict future gaps based on trends, and provide AI-powered food suggestions to fill those gaps.

## ✅ Key Features

### 1. Comprehensive Nutrient Analysis
- **Data Source**: Analyzes user's consumption logs (last 7 days).
- **Database**: Uses a local JSON database (`nutrition_data.json`) for nutrient values of common foods.
- **RDA Comparison**: Compares intake against Recommended Daily Allowances.
- **Gap Identification**: Flags nutrients with intake < 80% of RDA.

### 2. AI-Powered Food Suggestions (Gemini 2.0 Flash-Lite)
- **Personalized**: Suggests foods specifically targeting the identified gaps.
- **Contextual**: Explains *why* a food is suggested (e.g., "Spinach provides iron, and lemon helps absorption").
- **Structured Output**: Returns JSON with food name, reason, and target nutrients.

### 3. Predictive Analysis (Beta)
- **Trend Detection**: Analyzes weekly consumption patterns to predict likely future deficiencies (e.g., decreasing vegetable intake).

## 🛠️ Technical Implementation

### API Endpoint
**GET** `/api/ai/nutrient-gaps`

**Response:**
```json
{
  "success": true,
  "message": "Nutrient gap analysis completed successfully",
  "data": {
    "nutrient_levels": {
      "vitamin_c": 15.0,
      "iron": 5.0,
      ...
    },
    "deficiencies": [
      {
        "nutrient": "vitamin_c",
        "percentage": 16.7,
        "severity": "high",
        "recommendation": "Increase intake of vitamin_c-rich foods."
      }
    ],
    "predictions": [],
    "suggestions": [
      {
        "food": "Guava",
        "reason": "Extremely high in Vitamin C to boost immunity.",
        "nutrients": ["vitamin_c"]
      }
    ]
  }
}
```

### Services
- **`NutrientAnalyzer`**:
    - `analyze_gaps(user)`: Main entry point.
    - `_load_nutrition_data()`: Loads nutrient DB.
    - `_generate_ai_suggestions()`: Calls Gemini API.

## 🧪 Verification
Run the verification script:
```bash
python3 verify_nutrient_prediction.py
```
