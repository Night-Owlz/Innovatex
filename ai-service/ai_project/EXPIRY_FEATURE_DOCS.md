# ⚠️ Expiry Risk Prediction & Prioritization

## Overview
This feature helps users minimize food waste by predicting expiry risks and prioritizing items for consumption. It combines traditional FIFO (First-In-First-Out) logic with AI-driven scoring based on consumption habits and seasonality.

## ✅ Key Features

### 1. Smart Expiry Prediction
- **Data Source**: Uses inventory expiration dates and item categories.
- **Seasonality Adjustment**: Adjusts risk levels based on the current season (e.g., perishables degrade faster in summer).
- **Category Rules**: Applies specific spoilage rules for Fruits, Vegetables, Dairy, etc.

### 2. AI Prioritization Scoring (0-100)
Calculates a "Priority Score" for each item:
- **Urgency**: Closer to expiry = Higher score.
- **Consumption Frequency**: 
    - *Low Frequency*: Boosts priority (User likely to forget/waste it).
    - *High Frequency*: Lowers priority slightly (User consumes it naturally).
- **Logic**: `Score = Min(100, Urgency * Usage_Factor)`

### 3. Intelligent Alerts
- **Critical Risk (>80)**: "Consume immediately!"
- **High Risk (>50)**: "Plan to use soon."
- **Medium Risk (>30)**: Monitor.

## 🛠️ Technical Implementation

### API Endpoint
**GET** `/api/ai/expiry-risk`

**Response:**
```json
{
  "success": true,
  "message": "Expiry risk analysis completed",
  "data": {
    "analyzed_inventory": [
      {
        "item": "Spinach",
        "category": "vegetables",
        "days_until_expiry": 3.0,
        "consumption_freq_per_week": 0.0,
        "priority_score": 100.0,
        "risk_level": "Critical",
        "season_impact": "Normal"
      }
    ],
    "alerts": [
      "Consume Spinach immediately! High spoilage risk."
    ],
    "meta": {
      "season_factor": 1.0,
      "total_items": 4
    }
  }
}
```

### Services
- **`InventoryRiskAnalyzer`**:
    - `analyze_risk()`: Main orchestration.
    - `get_season_factor()`: Determines seasonal risk multiplier.
    - `calculate_consumption_frequency()`: Analyzes user habits.

## 🧪 Verification
Run the verification script:
```bash
python3 verify_expiry_risk.py
```
