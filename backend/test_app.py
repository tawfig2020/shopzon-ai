from flask import Flask, jsonify
from flask_cors import CORS
import redis
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Initialize Redis
redis_client = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379/0'))

@app.route('/')
def root():
    return jsonify({
        'message': 'Welcome to ShopSyncAI API',
        'endpoints': {
            'health_check': '/api/health',
            'test': '/api/test'
        }
    })

@app.route('/api/health')
def health_check():
    redis_status = True
    try:
        redis_client.ping()
    except:
        redis_status = False
    
    return jsonify({
        'status': 'healthy',
        'redis_connected': redis_status
    })

@app.route('/api/test')
def test_endpoint():
    return jsonify({
        'message': 'ShopSyncAI API is working!'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
