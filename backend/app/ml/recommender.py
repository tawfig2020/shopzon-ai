import tensorflow as tf
from tensorflow.keras import layers, Model
from typing import List, Dict, Tuple
import numpy as np
from google.cloud import aiplatform
from .config import RecommenderConfig

class ProductRecommender:
    def __init__(self, config: RecommenderConfig):
        self.config = config
        self.model = self._build_model()
        self.vertex_ai = aiplatform.init(
            project=config.vertex_ai_project,
            location=config.vertex_ai_region
        )
    
    def _build_model(self) -> Model:
        """Build two-tower recommendation model architecture."""
        # User tower
        user_input = layers.Input(shape=(len(self.config.user_features),))
        user_embedding = self._create_embedding_tower(user_input, "user")
        
        # Product tower
        product_input = layers.Input(shape=(len(self.config.product_features),))
        product_embedding = self._create_embedding_tower(product_input, "product")
        
        # Compute similarity
        dot_product = layers.Dot(axes=1)([user_embedding, product_embedding])
        output = layers.Dense(1, activation='sigmoid')(dot_product)
        
        model = Model(
            inputs=[user_input, product_input],
            outputs=output
        )
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=self.config.learning_rate),
            loss='binary_crossentropy',
            metrics=['accuracy', tf.keras.metrics.AUC()]
        )
        
        return model
    
    def _create_embedding_tower(self, input_layer: layers.Layer, name: str) -> layers.Layer:
        """Create an embedding tower for user/product features."""
        x = layers.Dense(512, activation='relu')(input_layer)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(256, activation='relu')(x)
        x = layers.Dropout(0.2)(x)
        x = layers.Dense(self.config.embedding_dim, activation='relu', name=f"{name}_embedding")(x)
        return x
    
    def train(self, train_data: Tuple[np.ndarray, np.ndarray], 
              validation_data: Tuple[np.ndarray, np.ndarray]) -> None:
        """Train the recommendation model using Vertex AI."""
        # Create Vertex AI custom training job
        job = aiplatform.CustomTrainingJob(
            display_name=f"train_{self.config.model_name}",
            script_path="train.py",
            container_uri="gcr.io/cloud-aiplatform/training/tf-cpu.2-12:latest",
            requirements=["tensorflow==2.12.0"]
        )
        
        # Start training job
        model = job.run(
            dataset=train_data,
            validation_data=validation_data,
            args=[
                f"--embedding_dim={self.config.embedding_dim}",
                f"--num_layers={self.config.num_layers}",
                f"--learning_rate={self.config.learning_rate}",
                f"--batch_size={self.config.batch_size}"
            ]
        )
        
        # Deploy model to endpoint
        endpoint = model.deploy(
            machine_type="n1-standard-2",
            min_replica_count=1,
            max_replica_count=3
        )
        
        self.endpoint = endpoint
    
    def generate_recommendations(self, user_features: np.ndarray, 
                               candidate_products: List[Dict]) -> List[Dict]:
        """Generate personalized product recommendations."""
        # Prepare product features
        product_features = np.array([
            [p[feature] for feature in self.config.product_features]
            for p in candidate_products
        ])
        
        # Get predictions from deployed endpoint
        predictions = self.endpoint.predict([user_features, product_features])
        
        # Sort products by prediction scores
        scored_products = [
            {**product, 'score': float(score)}
            for product, score in zip(candidate_products, predictions)
        ]
        scored_products.sort(key=lambda x: x['score'], reverse=True)
        
        return scored_products[:10]  # Return top 10 recommendations
    
    def update_embeddings(self, user_id: str, interaction_data: Dict) -> None:
        """Update user embeddings based on new interactions."""
        # Implementation for online learning and embedding updates
        pass
    
    def evaluate(self, test_data: Tuple[np.ndarray, np.ndarray]) -> Dict[str, float]:
        """Evaluate model performance on test data."""
        metrics = self.model.evaluate(test_data)
        return dict(zip(self.model.metrics_names, metrics))
