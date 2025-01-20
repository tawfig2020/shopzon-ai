# Recommendation Scenarios Guide

## Common Shopping Scenarios

### 1. Weekly Grocery Run
```javascript
{
  "scenario": {
    "name": "Weekly Groceries",
    "context": {
      "frequency": "Weekly",
      "budget": "Standard",
      "household": "Family of 4"
    },
    "recommendations": {
      "types": [
        {
          "category": "Staples",
          "reasoning": "Regular consumption patterns",
          "examples": [
            "Milk (2 gallons - based on usage)",
            "Bread (3 loaves - family size)",
            "Eggs (2 dozen - recipe planning)"
          ]
        },
        {
          "category": "Fresh Produce",
          "reasoning": "Seasonal availability",
          "examples": [
            "In-season fruits (price optimal)",
            "Weekly vegetables (meal plan)",
            "Fresh herbs (recipe match)"
          ]
        }
      ]
    }
  }
}
```

### 2. Special Occasion Shopping
```javascript
{
  "scenario": {
    "name": "Holiday Dinner",
    "context": {
      "event": "Family gathering",
      "guests": "10 people",
      "dietary": "Mixed preferences"
    },
    "recommendations": {
      "categories": [
        {
          "name": "Main Dishes",
          "suggestions": {
            "items": ["Turkey", "Vegetarian option"],
            "reasoning": "Guest preferences"
          }
        },
        {
          "name": "Sides",
          "suggestions": {
            "items": ["Various vegetables", "Gluten-free options"],
            "reasoning": "Dietary restrictions"
          }
        }
      ]
    }
  }
}
```

## Personalized Recommendations

### 1. Health-Conscious Shopping
```javascript
{
  "profile": {
    "preferences": {
      "dietary": "Low-carb",
      "restrictions": "Gluten-free",
      "goals": "Weight management"
    },
    "recommendations": {
      "substitutions": [
        {
          "original": "Regular pasta",
          "suggestion": "Zucchini noodles",
          "reasoning": "Low-carb alternative"
        },
        {
          "original": "White bread",
          "suggestion": "Almond flour bread",
          "reasoning": "Gluten-free option"
        }
      ],
      "new_items": [
        {
          "item": "Protein snacks",
          "reasoning": "Supports dietary goals"
        }
      ]
    }
  }
}
```

### 2. Budget Optimization
```javascript
{
  "profile": {
    "constraints": {
      "weekly_budget": "$150",
      "household_size": "3",
      "preferences": "Value-focused"
    },
    "recommendations": {
      "strategies": [
        {
          "type": "Bulk purchases",
          "items": [
            {
              "product": "Rice",
              "quantity": "20lb bag",
              "savings": "30% vs smaller packages"
            }
          ]
        },
        {
          "type": "Sale items",
          "recommendations": [
            {
              "product": "Frozen vegetables",
              "timing": "Stock up during sale",
              "savings": "Buy one get one free"
            }
          ]
        }
      ]
    }
  }
}
```

## Smart Features

### 1. Meal Planning Integration
```javascript
{
  "feature": {
    "name": "Smart Meal Planner",
    "workflow": {
      "steps": [
        {
          "action": "Analyze preferences",
          "data": {
            "dietary": "User preferences",
            "history": "Favorite meals",
            "season": "Available ingredients"
          }
        },
        {
          "action": "Generate plan",
          "output": {
            "meals": "Weekly schedule",
            "shopping": "Optimized list",
            "preparation": "Time estimates"
          }
        }
      ]
    }
  }
}
```

### 2. Price Watch
```javascript
{
  "feature": {
    "name": "Price Monitor",
    "functions": [
      {
        "type": "Track items",
        "actions": [
          "Monitor regular purchases",
          "Compare across stores",
          "Alert price drops"
        ]
      },
      {
        "type": "Predict sales",
        "actions": [
          "Analyze patterns",
          "Recommend timing",
          "Optimize purchases"
        ]
      }
    ]
  }
}
```

## Seasonal Adaptations

### 1. Summer Shopping
```javascript
{
  "season": {
    "name": "Summer",
    "adjustments": {
      "categories": [
        {
          "name": "Produce",
          "focus": [
            {
              "items": ["Berries", "Melons"],
              "reasoning": "Peak season, best price"
            }
          ]
        },
        {
          "name": "Beverages",
          "focus": [
            {
              "items": ["Hydration options"],
              "reasoning": "Weather appropriate"
            }
          ]
        }
      ]
    }
  }
}
```

### 2. Holiday Season
```javascript
{
  "season": {
    "name": "Winter Holidays",
    "recommendations": {
      "planning": {
        "advance_purchases": [
          {
            "category": "Non-perishables",
            "timing": "Early December",
            "reasoning": "Avoid rushes"
          }
        ],
        "fresh_items": [
          {
            "category": "Produce",
            "timing": "Few days before",
            "reasoning": "Optimal freshness"
          }
        ]
      }
    }
  }
}
```

## Learning and Adaptation

### 1. Preference Evolution
```javascript
{
  "learning": {
    "triggers": [
      {
        "event": "New dietary restriction",
        "adaptation": {
          "immediate": "Filter recommendations",
          "long_term": "Learn alternatives"
        }
      },
      {
        "event": "Budget change",
        "adaptation": {
          "immediate": "Adjust suggestions",
          "long_term": "Find new options"
        }
      }
    ]
  }
}
```

### 2. Feedback Integration
```javascript
{
  "feedback": {
    "sources": [
      {
        "type": "Direct ratings",
        "usage": {
          "immediate": "Adjust current list",
          "future": "Refine algorithm"
        }
      },
      {
        "type": "Purchase patterns",
        "usage": {
          "immediate": "Update frequencies",
          "future": "Predict needs"
        }
      }
    ]
  }
}
```
