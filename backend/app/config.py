import os
from google.cloud import storage
from google.cloud import bigquery

class Config:
    # Database Configuration
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Google Cloud Storage
    STORAGE_BUCKET = os.getenv('STORAGE_BUCKET')
    storage_client = storage.Client()
    
    # BigQuery Configuration
    BIGQUERY_DATASET = os.getenv('BIGQUERY_DATASET', 'shopsync_analytics')
    bigquery_client = bigquery.Client()
    
    # Security Configuration
    SECRET_KEY = os.getenv('FLASK_SECRET_KEY')
    GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
    GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')
    
    # Cloud SQL Connection
    DB_HOST = os.getenv('DB_HOST')
    DB_USER = os.getenv('DB_USER')
    DB_PASS = os.getenv('DB_PASS')
    DB_NAME = os.getenv('DB_NAME')
    
    # Analytics Configuration
    ENABLE_ANALYTICS = os.getenv('ENABLE_ANALYTICS', 'True').lower() == 'true'
    
    # ML Configuration
    ML_MODEL_BUCKET = os.getenv('ML_MODEL_BUCKET', 'shopsync-ml-models')
    VERTEX_AI_ENDPOINT = os.getenv('VERTEX_AI_ENDPOINT')
    MLFLOW_TRACKING_URI = os.getenv('MLFLOW_TRACKING_URI')
    
    # Model Training Configuration
    MODEL_TRAINING = {
        'batch_size': int(os.getenv('MODEL_BATCH_SIZE', '32')),
        'epochs': int(os.getenv('MODEL_EPOCHS', '10')),
        'learning_rate': float(os.getenv('MODEL_LEARNING_RATE', '0.001')),
        'validation_split': float(os.getenv('MODEL_VALIDATION_SPLIT', '0.2')),
        'early_stopping_patience': int(os.getenv('EARLY_STOPPING_PATIENCE', '3'))
    }
    
    # Model Retraining Configuration
    MODEL_RETRAINING = {
        'check_interval_seconds': int(os.getenv('RETRAINING_CHECK_INTERVAL', '3600')),
        'max_days_without_retraining': int(os.getenv('MAX_DAYS_WITHOUT_RETRAINING', '7')),
        'performance_threshold': float(os.getenv('PERFORMANCE_THRESHOLD', '0.1')),
        'drift_threshold': float(os.getenv('DRIFT_THRESHOLD', '0.2')),
        'min_improvement_threshold': float(os.getenv('MIN_IMPROVEMENT_THRESHOLD', '0.05'))
    }
    
    # Feature Engineering Configuration
    FEATURE_ENGINEERING = {
        'max_text_features': int(os.getenv('MAX_TEXT_FEATURES', '100')),
        'categorical_encoding': os.getenv('CATEGORICAL_ENCODING', 'label'),
        'numerical_scaling': os.getenv('NUMERICAL_SCALING', 'standard'),
        'feature_store_dataset': os.getenv('FEATURE_STORE_DATASET', 'feature_store')
    }
    
    # Monitoring Configuration
    MONITORING = {
        'enable_prometheus': os.getenv('ENABLE_PROMETHEUS', 'True').lower() == 'true',
        'prometheus_port': int(os.getenv('PROMETHEUS_PORT', '9090')),
        'enable_elasticsearch': os.getenv('ENABLE_ELASTICSEARCH', 'True').lower() == 'true',
        'elasticsearch_hosts': os.getenv('ELASTICSEARCH_HOSTS', 'http://localhost:9200').split(','),
        'alert_channels': os.getenv('ALERT_CHANNELS', 'slack,email').split(','),
        'slack_webhook_url': os.getenv('SLACK_WEBHOOK_URL'),
        'alert_email': os.getenv('ALERT_EMAIL')
    }
    
    @staticmethod
    def init_app(app):
        # Initialize storage bucket
        bucket = Config.storage_client.bucket(Config.STORAGE_BUCKET)
        if not bucket.exists():
            bucket.create()
        
        # Initialize ML model bucket
        model_bucket = Config.storage_client.bucket(Config.ML_MODEL_BUCKET)
        if not model_bucket.exists():
            model_bucket.create()
        
        # Initialize BigQuery dataset
        dataset_ref = Config.bigquery_client.dataset(Config.BIGQUERY_DATASET)
        try:
            Config.bigquery_client.get_dataset(dataset_ref)
        except Exception:
            dataset = bigquery.Dataset(dataset_ref)
            dataset.location = "US"
            Config.bigquery_client.create_dataset(dataset)
        
        # Initialize feature store dataset
        feature_store_ref = Config.bigquery_client.dataset(
            Config.FEATURE_ENGINEERING['feature_store_dataset']
        )
        try:
            Config.bigquery_client.get_dataset(feature_store_ref)
        except Exception:
            dataset = bigquery.Dataset(feature_store_ref)
            dataset.location = "US"
            Config.bigquery_client.create_dataset(dataset)

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_ECHO = True
    
    # Development ML settings
    MODEL_TRAINING = {
        **Config.MODEL_TRAINING,
        'batch_size': 16,
        'epochs': 5
    }
    
    MODEL_RETRAINING = {
        **Config.MODEL_RETRAINING,
        'check_interval_seconds': 1800  # Check every 30 minutes in development
    }

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_ECHO = False
    
    # Production-specific settings
    SQLALCHEMY_POOL_SIZE = 10
    SQLALCHEMY_MAX_OVERFLOW = 20
    SQLALCHEMY_POOL_TIMEOUT = 30
    
    # Production ML settings
    MODEL_TRAINING = {
        **Config.MODEL_TRAINING,
        'batch_size': 64,
        'epochs': 20
    }
    
    MODEL_RETRAINING = {
        **Config.MODEL_RETRAINING,
        'check_interval_seconds': 7200  # Check every 2 hours in production
    }

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
