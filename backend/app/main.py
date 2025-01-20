from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# OAuth Configuration
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    client_kwargs={'scope': 'openid email profile'}
)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    google_id = db.Column(db.String(100), unique=True)
    email = db.Column(db.String(100), unique=True)
    name = db.Column(db.String(100))
    profile_picture = db.Column(db.String(200))

# Authentication Routes
@app.route('/auth/google')
def google_login():
    redirect_uri = url_for('google_authorize', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/google/callback')
def google_authorize():
    token = google.authorize_access_token()
    resp = google.get('userinfo')
    user_info = resp.json()
    
    # Create or update user in database
    user = User.query.filter_by(google_id=user_info['id']).first()
    if not user:
        user = User(
            google_id=user_info['id'],
            email=user_info['email'],
            name=user_info['name'],
            profile_picture=user_info.get('picture')
        )
        db.session.add(user)
        db.session.commit()
    
    # Generate JWT or session token
    # Implement token generation logic here
    
    return jsonify(user_info), 200

# Product Recommendation Route
@app.route('/recommendations', methods=['GET'])
def get_recommendations():
    # Implement AI-driven recommendation logic
    # This would use LangGraph and ML models to generate personalized recommendations
    recommendations = []  # Placeholder
    return jsonify(recommendations), 200

# Dynamic Pricing Route
@app.route('/pricing', methods=['GET'])
def get_dynamic_pricing():
    # Implement dynamic pricing algorithm
    pricing_data = {}  # Placeholder
    return jsonify(pricing_data), 200

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True)
