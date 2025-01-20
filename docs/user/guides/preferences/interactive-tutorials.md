# Interactive Preference Tutorials

## Getting Started

### 1. Preference Setup Wizard
```javascript
{
  "tutorial": {
    "name": "Initial Setup",
    "steps": [
      {
        "step": "Basic Information",
        "interaction": {
          "type": "Form",
          "fields": [
            {
              "name": "Dietary Preferences",
              "type": "Multi-select",
              "options": ["Vegetarian", "Vegan", "Gluten-free"]
            },
            {
              "name": "Shopping Frequency",
              "type": "Single-select",
              "options": ["Daily", "Weekly", "Monthly"]
            }
          ]
        }
      },
      {
        "step": "Budget Settings",
        "interaction": {
          "type": "Slider",
          "ranges": {
            "weekly_budget": {
              "min": 50,
              "max": 500,
              "step": 50
            }
          }
        }
      }
    ]
  }
}
```

## Interactive Exercises

### 1. Brand Preference Training
```javascript
{
  "exercise": {
    "name": "Brand Selection",
    "scenario": {
      "setup": "You're shopping for breakfast cereals",
      "steps": [
        {
          "action": "Show brand options",
          "user_task": "Rate brands 1-5",
          "ai_response": {
            "learn": "Brand preferences",
            "update": "Recommendation model"
          }
        },
        {
          "action": "Present alternatives",
          "user_task": "Accept/reject suggestions",
          "ai_response": {
            "refine": "Understanding",
            "adapt": "Future recommendations"
          }
        }
      ]
    }
  }
}
```

### 2. Price Sensitivity Training
```javascript
{
  "exercise": {
    "name": "Price Preferences",
    "scenario": {
      "setup": "Compare similar products at different price points",
      "steps": [
        {
          "action": "Show price ranges",
          "user_task": "Select acceptable ranges",
          "ai_response": {
            "learn": "Price sensitivity",
            "update": "Budget preferences"
          }
        },
        {
          "action": "Present deals",
          "user_task": "Evaluate value propositions",
          "ai_response": {
            "refine": "Deal preferences",
            "adapt": "Future offers"
          }
        }
      ]
    }
  }
}
```

## Guided Learning Scenarios

### 1. Weekly Shopping Simulation
```javascript
{
  "simulation": {
    "name": "Smart Shopping Assistant",
    "scenario": {
      "setup": {
        "budget": "$200",
        "timeframe": "Weekly shop",
        "preferences": "Previously set"
      },
      "tasks": [
        {
          "step": "Review Recommendations",
          "actions": [
            "View suggested items",
            "Adjust quantities",
            "Accept/reject items"
          ]
        },
        {
          "step": "Optimize List",
          "actions": [
            "Compare prices",
            "Find alternatives",
            "Apply coupons"
          ]
        }
      ]
    }
  }
}
```

### 2. Meal Planning Exercise
```javascript
{
  "simulation": {
    "name": "Meal Preference Learning",
    "scenario": {
      "setup": {
        "dietary": "User preferences",
        "servings": "Household size",
        "frequency": "Weekly plan"
      },
      "tasks": [
        {
          "step": "Select Meals",
          "actions": [
            "Rate suggested meals",
            "Modify ingredients",
            "Set portion sizes"
          ]
        },
        {
          "step": "Generate Shopping List",
          "actions": [
            "Review ingredients",
            "Adjust quantities",
            "Optimize for budget"
          ]
        }
      ]
    }
  }
}
```

## Preference Refinement Games

### 1. Product Match Game
```javascript
{
  "game": {
    "name": "Perfect Match",
    "rules": {
      "setup": "Show product pairs",
      "task": "Choose preferred option",
      "scoring": "Preference strength",
      "learning": {
        "capture": "Choice patterns",
        "apply": "Update preferences"
      }
    }
  }
}
```

### 2. Budget Challenge
```javascript
{
  "game": {
    "name": "Smart Shopper",
    "rules": {
      "setup": "Weekly budget scenario",
      "task": "Optimize shopping list",
      "scoring": {
        "savings": "Points for deals",
        "preferences": "Points for matches"
      }
    }
  }
}
```

## Progress Tracking

### 1. Preference Profile
```javascript
{
  "tracking": {
    "metrics": [
      {
        "category": "Profile Completion",
        "aspects": [
          "Basic preferences",
          "Brand choices",
          "Price ranges",
          "Shopping habits"
        ]
      },
      {
        "category": "Recommendation Accuracy",
        "aspects": [
          "Acceptance rate",
          "Satisfaction score",
          "Learning progress"
        ]
      }
    ]
  }
}
```

### 2. Learning Achievements
```javascript
{
  "achievements": {
    "levels": [
      {
        "name": "Preference Pioneer",
        "requirements": "Complete initial setup",
        "reward": "Custom recommendations"
      },
      {
        "name": "Smart Shopper",
        "requirements": "Use smart features 10 times",
        "reward": "Advanced optimization"
      },
      {
        "name": "Budget Master",
        "requirements": "Stay under budget 5 weeks",
        "reward": "Special deals access"
      }
    ]
  }
}
```

## Feedback and Improvement

### 1. Interactive Feedback
```javascript
{
  "feedback": {
    "methods": [
      {
        "type": "Quick Rating",
        "usage": "Rate recommendations 1-5",
        "impact": "Immediate adjustment"
      },
      {
        "type": "Detailed Review",
        "usage": "Monthly preference review",
        "impact": "Major profile update"
      }
    ]
  }
}
```

### 2. Preference Analytics
```javascript
{
  "analytics": {
    "reports": [
      {
        "type": "Preference Trends",
        "metrics": [
          "Category preferences",
          "Price sensitivity",
          "Brand loyalty"
        ]
      },
      {
        "type": "Recommendation Performance",
        "metrics": [
          "Accuracy rate",
          "Savings achieved",
          "Time saved"
        ]
      }
    ]
  }
}
```
