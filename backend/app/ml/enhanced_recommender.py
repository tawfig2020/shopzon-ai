from typing import List, Dict, Optional
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import tensorflow as tf
import torch
import torch.nn as nn
from transformers import AutoTokenizer, AutoModel
import pandas as pd
from google.cloud import aiplatform
from datetime import datetime
import asyncio
from ..monitoring import MonitoringService
from ..database import AsyncDatabase

class HybridRecommender:
    def __init__(self, config: Dict):
        self.config = config
        self.monitoring = MonitoringService()
        self.db = AsyncDatabase()
        self.tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
        self.text_encoder = AutoModel.from_pretrained('bert-base-uncased')
        self.scaler = StandardScaler()
        
        # Initialize neural collaborative filtering model
        self.ncf_model = self._build_ncf_model()
        
        # Initialize vertex AI client
        self.vertex_ai = aiplatform.gapic.PredictionServiceClient(
            client_options={"api_endpoint": config["vertex_ai_endpoint"]}
        )

    def _build_ncf_model(self) -> tf.keras.Model:
        """Build Neural Collaborative Filtering model."""
        # User tower
        user_input = tf.keras.layers.Input(shape=(self.config["user_features"],))
        user_embedding = tf.keras.layers.Dense(128, activation='relu')(user_input)
        user_embedding = tf.keras.layers.Dropout(0.3)(user_embedding)
        
        # Item tower
        item_input = tf.keras.layers.Input(shape=(self.config["item_features"],))
        item_embedding = tf.keras.layers.Dense(128, activation='relu')(item_input)
        item_embedding = tf.keras.layers.Dropout(0.3)(item_embedding)
        
        # Merge towers
        merged = tf.keras.layers.Concatenate()([user_embedding, item_embedding])
        merged = tf.keras.layers.Dense(64, activation='relu')(merged)
        merged = tf.keras.layers.Dropout(0.3)(merged)
        merged = tf.keras.layers.Dense(32, activation='relu')(merged)
        
        # Output layer
        output = tf.keras.layers.Dense(1, activation='sigmoid')(merged)
        
        model = tf.keras.Model(
            inputs=[user_input, item_input],
            outputs=output
        )
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='binary_crossentropy',
            metrics=['accuracy']
        )
        
        return model

    async def get_personalized_recommendations(
        self, 
        user_id: str, 
        n_recommendations: int = 10,
        context: Optional[Dict] = None
    ) -> List[Dict]:
        """Get personalized recommendations using hybrid approach."""
        try:
            # Start monitoring
            start_time = datetime.now()
            
            # Get user features and history
            user_features = await self._get_user_features(user_id)
            user_history = await self._get_user_history(user_id)
            
            # Get candidate items
            candidates = await self._get_candidate_items(user_id, context)
            
            # Get different types of recommendations
            collaborative_scores = await self._get_collaborative_scores(
                user_features, candidates
            )
            content_scores = await self._get_content_based_scores(
                user_history, candidates
            )
            context_scores = await self._get_contextual_scores(
                user_id, candidates, context
            )
            
            # Combine scores using weighted average
            final_scores = (
                self.config["collaborative_weight"] * collaborative_scores +
                self.config["content_weight"] * content_scores +
                self.config["context_weight"] * context_scores
            )
            
            # Get top N recommendations
            top_indices = np.argsort(final_scores)[-n_recommendations:][::-1]
            recommendations = [candidates[i] for i in top_indices]
            
            # Enrich recommendations with additional data
            enriched_recommendations = await self._enrich_recommendations(
                recommendations, user_id, context
            )
            
            # Log metrics
            await self._log_recommendation_metrics(
                user_id, enriched_recommendations, start_time
            )
            
            return enriched_recommendations
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "recommender",
                "operation": "get_personalized_recommendations",
                "user_id": user_id
            })
            raise

    async def _get_user_features(self, user_id: str) -> np.ndarray:
        """Get user features from database and process them."""
        user_data = await self.db.get_user_features(user_id)
        
        # Process categorical features
        categorical_features = self._process_categorical_features(
            user_data["categorical_features"]
        )
        
        # Process numerical features
        numerical_features = self.scaler.transform(
            user_data["numerical_features"].reshape(1, -1)
        )
        
        return np.concatenate([categorical_features, numerical_features], axis=1)

    async def _get_content_based_scores(
        self, 
        user_history: List[Dict],
        candidates: List[Dict]
    ) -> np.ndarray:
        """Calculate content-based similarity scores."""
        # Encode user history items
        history_embeddings = self._get_text_embeddings(
            [item["description"] for item in user_history]
        )
        
        # Encode candidate items
        candidate_embeddings = self._get_text_embeddings(
            [item["description"] for item in candidates]
        )
        
        # Calculate similarity scores
        similarity_scores = cosine_similarity(
            candidate_embeddings, 
            history_embeddings
        )
        
        # Take maximum similarity for each candidate
        return similarity_scores.max(axis=1)

    def _get_text_embeddings(self, texts: List[str]) -> np.ndarray:
        """Get BERT embeddings for text data."""
        # Tokenize texts
        encoded = self.tokenizer(
            texts,
            padding=True,
            truncation=True,
            max_length=128,
            return_tensors='pt'
        )
        
        # Get BERT embeddings
        with torch.no_grad():
            outputs = self.text_encoder(**encoded)
            embeddings = outputs.last_hidden_state[:, 0, :].numpy()
        
        return embeddings

    async def _get_contextual_scores(
        self,
        user_id: str,
        candidates: List[Dict],
        context: Optional[Dict]
    ) -> np.ndarray:
        """Get contextual recommendation scores using Vertex AI."""
        if not context:
            return np.zeros(len(candidates))
        
        # Prepare features for Vertex AI
        instances = [
            {
                "user_id": user_id,
                "item_id": candidate["id"],
                **context
            }
            for candidate in candidates
        ]
        
        # Get predictions from Vertex AI
        response = await self.vertex_ai.predict(
            endpoint=self.config["vertex_ai_endpoint"],
            instances=instances
        )
        
        return np.array([pred.scores[0] for pred in response.predictions])

    async def _enrich_recommendations(
        self,
        recommendations: List[Dict],
        user_id: str,
        context: Optional[Dict]
    ) -> List[Dict]:
        """Enrich recommendations with additional data."""
        enriched = []
        for rec in recommendations:
            # Get real-time price and inventory
            price_info = await self._get_dynamic_price(rec["id"], user_id, context)
            inventory = await self._get_inventory_status(rec["id"])
            
            # Get social proof
            social_proof = await self._get_social_proof(rec["id"])
            
            enriched.append({
                **rec,
                "price": price_info["price"],
                "original_price": price_info["original_price"],
                "discount_percentage": price_info["discount_percentage"],
                "inventory_status": inventory["status"],
                "inventory_count": inventory["count"],
                "ratings_count": social_proof["ratings_count"],
                "average_rating": social_proof["average_rating"],
                "recent_purchases": social_proof["recent_purchases"]
            })
        
        return enriched

    async def _log_recommendation_metrics(
        self,
        user_id: str,
        recommendations: List[Dict],
        start_time: datetime
    ):
        """Log recommendation metrics for monitoring."""
        duration = (datetime.now() - start_time).total_seconds()
        
        await self.monitoring.log_metrics({
            "recommendation_latency": duration,
            "recommendation_count": len(recommendations),
            "user_id": user_id,
            "timestamp": datetime.now().isoformat()
        })

    async def train_models(self, training_data: pd.DataFrame):
        """Train recommendation models."""
        try:
            # Train NCF model
            user_features = training_data["user_features"].values
            item_features = training_data["item_features"].values
            labels = training_data["interactions"].values
            
            history = self.ncf_model.fit(
                [user_features, item_features],
                labels,
                epochs=self.config["training_epochs"],
                batch_size=self.config["batch_size"],
                validation_split=0.2
            )
            
            # Log training metrics
            await self.monitoring.log_metrics({
                "training_loss": history.history["loss"][-1],
                "training_accuracy": history.history["accuracy"][-1],
                "val_loss": history.history["val_loss"][-1],
                "val_accuracy": history.history["val_accuracy"][-1],
                "timestamp": datetime.now().isoformat()
            })
            
            # Save models
            await self._save_models()
            
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "recommender",
                "operation": "train_models"
            })
            raise

    async def _save_models(self):
        """Save trained models to cloud storage."""
        try:
            # Save NCF model
            self.ncf_model.save(self.config["model_path"])
            
            # Save scaler
            np.save(
                f"{self.config['model_path']}/scaler.npy",
                self.scaler.get_params()
            )
            
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "recommender",
                "operation": "save_models"
            })
            raise
