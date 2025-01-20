from flask import Flask, jsonify, request
from flask_cors import CORS
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# Mock data
PRODUCTS = [
    {"id": 1, "name": "Laptop Pro X", "category": "Electronics", "base_price": 999.99},
    {"id": 2, "name": "Smart Watch Elite", "category": "Electronics", "base_price": 299.99},
    {"id": 3, "name": "Premium Headphones", "category": "Electronics", "base_price": 199.99},
    {"id": 4, "name": "Designer Backpack", "category": "Fashion", "base_price": 79.99},
    {"id": 5, "name": "Running Shoes Pro", "category": "Sports", "base_price": 129.99},
]

USERS = [
    {"id": 1, "name": "John Doe", "preferences": ["Electronics", "Sports"]},
    {"id": 2, "name": "Jane Smith", "preferences": ["Fashion", "Electronics"]},
]

# Simplified recommendation system
def get_personalized_recommendations(user_id, n_recommendations=3):
    user = next((u for u in USERS if u["id"] == user_id), None)
    if not user:
        return []
    
    # Simple preference-based filtering with scores
    recommended_products = []
    for product in PRODUCTS:
        if product["category"] in user["preferences"]:
            product_with_score = product.copy()
            # Higher score for products in preferred categories
            product_with_score["score"] = np.random.uniform(0.5, 1.0)
            recommended_products.append(product_with_score)
    
    # Sort by score and return top N
    return sorted(recommended_products, key=lambda x: x["score"], reverse=True)[:n_recommendations]

# Simplified dynamic pricing
def calculate_dynamic_price(product_id):
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        return None
    
    # Simple time-based pricing
    hour = datetime.now().hour
    
    # Higher prices during peak hours (9 AM - 5 PM)
    if 9 <= hour <= 17:
        multiplier = np.random.uniform(1.1, 1.2)
    else:
        multiplier = np.random.uniform(0.9, 1.0)
    
    # Add some randomness for demand simulation
    demand_factor = np.random.uniform(0.95, 1.05)
    
    final_price = product["base_price"] * multiplier * demand_factor
    
    return {
        "product_id": product_id,
        "base_price": product["base_price"],
        "final_price": round(final_price, 2),
        "discount_percentage": round((1 - final_price/product["base_price"]) * 100, 1)
    }

@app.route('/api/recommendations/<int:user_id>')
def get_recommendations(user_id):
    recommendations = get_personalized_recommendations(user_id)
    return jsonify({
        "user_id": user_id,
        "recommendations": recommendations
    })

@app.route('/api/pricing/<int:product_id>')
def get_pricing(product_id):
    pricing = calculate_dynamic_price(product_id)
    if not pricing:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(pricing)

@app.route('/api/products')
def get_products():
    return jsonify(PRODUCTS)

@app.route('/api/users')
def get_users():
    return jsonify(USERS)

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "preview-1.0"
    })

if __name__ == '__main__':
    print("\n=== ShopSyncAI Preview Mode ===")
    print("Available endpoints:")
    print("  - GET /api/recommendations/<user_id>")
    print("  - GET /api/pricing/<product_id>")
    print("  - GET /api/products")
    print("  - GET /api/users")
    print("  - GET /health")
    print("\nExample URLs:")
    print("  - http://localhost:5000/api/recommendations/1")
    print("  - http://localhost:5000/api/pricing/1")
    print("\nStarting preview server...")
    app.run(debug=True)
