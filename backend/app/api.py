from flask import Blueprint, jsonify, request
from google.cloud import storage
from google.cloud import bigquery
from datetime import datetime
from .models import (
    User, Product, UserInteraction, 
    Recommendation, DynamicPricing, db
)

api = Blueprint('api', __name__)
storage_client = storage.Client()
bigquery_client = bigquery.Client()

# Product Management
@api.route('/products', methods=['GET'])
def get_products():
    products = Product.query.all()
    return jsonify([{
        'id': p.id,
        'name': p.name,
        'current_price': float(p.current_price),
        'category': p.category,
        'image_urls': p.image_urls
    } for p in products])

@api.route('/products/<int:product_id>', methods=['GET'])
def get_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify({
        'id': product.id,
        'name': product.name,
        'description': product.description,
        'current_price': float(product.current_price),
        'category': product.category,
        'tags': product.tags,
        'image_urls': product.image_urls,
        'inventory_count': product.inventory_count
    })

# User Interactions
@api.route('/interactions', methods=['POST'])
def record_interaction():
    data = request.json
    interaction = UserInteraction(
        user_id=data['user_id'],
        product_id=data['product_id'],
        interaction_type=data['type'],
        metadata=data.get('metadata', {})
    )
    db.session.add(interaction)
    db.session.commit()
    
    # Log to BigQuery for analytics
    table_id = f"{bigquery_client.project}.shopsync_analytics.user_interactions"
    rows_to_insert = [{
        'user_id': data['user_id'],
        'product_id': data['product_id'],
        'interaction_type': data['type'],
        'timestamp': datetime.utcnow().isoformat()
    }]
    
    errors = bigquery_client.insert_rows_json(table_id, rows_to_insert)
    if errors:
        print(f"Encountered errors while inserting rows: {errors}")
    
    return jsonify({'status': 'success'})

# Recommendations
@api.route('/recommendations/<int:user_id>', methods=['GET'])
def get_recommendations(user_id):
    recommendations = Recommendation.query.filter_by(
        user_id=user_id
    ).order_by(Recommendation.score.desc()).limit(10).all()
    
    return jsonify([{
        'product_id': r.product_id,
        'score': r.score,
        'reason': r.reason
    } for r in recommendations])

# Dynamic Pricing
@api.route('/pricing/<int:product_id>', methods=['GET'])
def get_dynamic_price(product_id):
    current_price = DynamicPricing.query.filter_by(
        product_id=product_id
    ).order_by(DynamicPricing.valid_from.desc()).first()
    
    if not current_price:
        product = Product.query.get_or_404(product_id)
        return jsonify({
            'price': float(product.base_price),
            'is_dynamic': False
        })
    
    return jsonify({
        'price': float(current_price.price),
        'factors': current_price.factors,
        'valid_until': current_price.valid_until.isoformat(),
        'is_dynamic': True
    })

# Media Storage
@api.route('/upload', methods=['POST'])
def upload_media():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
        
    file = request.files['file']
    bucket = storage_client.bucket(current_app.config['STORAGE_BUCKET'])
    blob = bucket.blob(f"media/{datetime.utcnow().timestamp()}_{file.filename}")
    
    blob.upload_from_string(
        file.read(),
        content_type=file.content_type
    )
    
    return jsonify({
        'url': blob.public_url,
        'status': 'success'
    })
