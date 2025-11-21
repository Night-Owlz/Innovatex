# 🌍 SDG Impact Scoring Engine - Feature Documentation

## Overview
The SDG Impact Scoring Engine evaluates user progress towards UN Sustainable Development Goals (SDGs), specifically focusing on **SDG 2 (Zero Hunger)**, **SDG 3 (Good Health and Well-being)**, and **SDG 12 (Responsible Consumption and Production)**. It uses AI to generate personalized insights and actionable recommendations.

## ✅ Key Features

### 1. Multi-Dimensional SDG Scoring (0-100)
- **Overall SDG Score**: Weighted average of component scores.
- **SDG 2 (Zero Hunger)**: Evaluates nutrition adequacy and food security.
- **SDG 3 (Good Health)**: Assesses diet quality, meal diversity, and health impact.
- **SDG 12 (Responsible Consumption)**: Measures food waste reduction and sustainable choices.

### 2. AI-Powered Insights (Gemini 2.0 Flash-Lite)
- Generates a weekly summary of the user's impact.
- Provides a motivational celebration message.
- Suggests 3 specific, actionable steps aligned with SDG targets (e.g., "Reduce Food Waste (SDG 12.3)").

### 3. Real-Time Data Integration
- Fetches data from:
    - **Waste Predictions**: For waste reduction metrics.
    - **Nutrient Analysis**: For nutrition adequacy.
    - **Meal Plans**: For diet diversity and sustainability.

### 4. Progress Tracking
- Tracks week-over-week score changes.
- Identifies trends (Improving, Stable, Declining).

## 🛠️ Technical Implementation

### API Endpoint
**POST** `/api/ai/calculate-sdg-score`

**Request Body:**
```json
{
  "week_start_date": "2025-11-25" // Optional, defaults to current week
}
```

**Response:**
```json
{
  "success": true,
  "message": "SDG score calculated successfully",
  "data": {
    "overallSDGScore": 80.0,
    "sdgBreakdown": {
      "sdg2ZeroHunger": 70.0,
      "sdg3GoodHealth": 75.0,
      "sdg12ResponsibleConsumption": 90.0
    },
    "weeklyInsight": "Your overall SDG progress is strong...",
    "celebrationMessage": "Keep up the excellent work!",
    "actionSteps": [
      {
        "title": "Reduce Food Waste",
        "sdg_target": "SDG 12.3",
        "potentialImpact": "+3 points"
      }
    ]
  }
}
```

### Models
- **`SDGScore`**: Stores weekly scores, insights, and metrics.

### Services
- **`SDGScorer`**: Contains the logic for calculating scores and interfacing with the Gemini API.

## 🧪 Verification
Run the verification script to test the feature:
```bash
python3 verify_sdg_feature.py
```
