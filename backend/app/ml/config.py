from dataclasses import dataclass
from typing import List, Dict, Any
import os

@dataclass
class ModelConfig:
    model_name: str
    version: str
    framework: str
    artifact_uri: str
    
@dataclass
class RecommenderConfig(ModelConfig):
    embedding_dim: int = 128
    num_layers: int = 2
    learning_rate: float = 0.001
    batch_size: int = 64
    
@dataclass
class PricingConfig(ModelConfig):
    state_dim: int = 64
    action_dim: int = 100
    hidden_dim: int = 256
    gamma: float = 0.99
    
@dataclass
class MLConfig:
    vertex_ai_project: str = os.getenv('VERTEX_AI_PROJECT')
    vertex_ai_region: str = os.getenv('VERTEX_AI_REGION', 'us-central1')
    bigquery_dataset: str = os.getenv('BIGQUERY_DATASET', 'shopsync_analytics')
    
    # Model configurations
    recommender: RecommenderConfig = RecommenderConfig(
        model_name='product_recommender',
        version='v1',
        framework='tensorflow',
        artifact_uri='gs://shopsync-models/recommender',
    )
    
    pricing: PricingConfig = PricingConfig(
        model_name='dynamic_pricing',
        version='v1',
        framework='pytorch',
        artifact_uri='gs://shopsync-models/pricing',
    )
    
    # Feature configurations
    user_features: List[str] = [
        'age', 'gender', 'location', 'purchase_history_length',
        'avg_order_value', 'preferred_categories'
    ]
    
    product_features: List[str] = [
        'category', 'price', 'description_embedding',
        'avg_rating', 'total_purchases', 'inventory_level'
    ]
    
    # Training configurations
    training_config: Dict[str, Any] = {
        'epochs': 100,
        'early_stopping_patience': 5,
        'validation_split': 0.2,
        'max_trials': 10
    }
    
    # Monitoring configurations
    monitoring_config: Dict[str, Any] = {
        'metrics': ['precision@k', 'recall@k', 'ndcg@k'],
        'monitoring_interval': 3600,  # 1 hour
        'alert_threshold': 0.1  # 10% degradation
    }
