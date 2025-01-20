from typing import Dict, List, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from datetime import datetime, timedelta
import asyncio
from google.cloud import bigquery
from ..monitoring import MonitoringService
from ..database import AsyncDatabase

class DynamicPricingEngine:
    def __init__(self, config: Dict):
        self.config = config
        self.monitoring = MonitoringService()
        self.db = AsyncDatabase()
        self.bq_client = bigquery.Client()
        
        # Initialize models
        self.demand_model = self._build_demand_model()
        self.elasticity_model = self._build_elasticity_model()
        self.price_optimizer = self._build_price_optimizer()
        self.scaler = StandardScaler()

    def _build_demand_model(self) -> tf.keras.Model:
        """Build deep learning model for demand prediction."""
        model = tf.keras.Sequential([
            tf.keras.layers.Dense(128, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='linear')
        ])
        
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
            loss='mse',
            metrics=['mae']
        )
        
        return model

    def _build_elasticity_model(self) -> GradientBoostingRegressor:
        """Build gradient boosting model for price elasticity."""
        return GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=3
        )

    def _build_price_optimizer(self) -> tf.keras.Model:
        """Build reinforcement learning model for price optimization."""
        # Actor network
        actor = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='sigmoid')
        ])
        
        # Critic network
        critic = tf.keras.Sequential([
            tf.keras.layers.Dense(64, activation='relu'),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(1, activation='linear')
        ])
        
        return {"actor": actor, "critic": critic}

    async def get_optimal_price(
        self,
        product_id: str,
        user_id: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> Dict:
        """Get optimal price for a product considering various factors."""
        try:
            start_time = datetime.now()
            
            # Get base features
            features = await self._get_pricing_features(product_id, user_id, context)
            
            # Predict demand
            predicted_demand = await self._predict_demand(features)
            
            # Calculate price elasticity
            elasticity = await self._calculate_elasticity(features)
            
            # Get competitor prices
            competitor_prices = await self._get_competitor_prices(product_id)
            
            # Calculate optimal price
            optimal_price = await self._optimize_price(
                features,
                predicted_demand,
                elasticity,
                competitor_prices
            )
            
            # Apply business rules and constraints
            final_price = await self._apply_pricing_rules(
                product_id,
                optimal_price,
                user_id,
                context
            )
            
            # Log pricing decision
            await self._log_pricing_decision(
                product_id,
                final_price,
                features,
                start_time
            )
            
            return {
                "price": final_price["price"],
                "original_price": final_price["original_price"],
                "discount_percentage": final_price["discount_percentage"],
                "valid_until": final_price["valid_until"],
                "reason": final_price["reason"]
            }
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "dynamic_pricing",
                "operation": "get_optimal_price",
                "product_id": product_id
            })
            raise

    async def _get_pricing_features(
        self,
        product_id: str,
        user_id: Optional[str],
        context: Optional[Dict]
    ) -> Dict:
        """Get features for pricing decisions."""
        # Get product data
        product_data = await self.db.get_product_data(product_id)
        
        # Get historical sales data
        sales_data = await self._get_historical_sales(product_id)
        
        # Get market data
        market_data = await self._get_market_data(product_id)
        
        # Get inventory data
        inventory_data = await self._get_inventory_data(product_id)
        
        # Get user segment data if available
        user_data = await self._get_user_data(user_id) if user_id else None
        
        # Get seasonal factors
        seasonal_factors = self._calculate_seasonal_factors()
        
        return {
            "product_data": product_data,
            "sales_data": sales_data,
            "market_data": market_data,
            "inventory_data": inventory_data,
            "user_data": user_data,
            "seasonal_factors": seasonal_factors,
            "context": context
        }

    async def _predict_demand(self, features: Dict) -> float:
        """Predict demand using deep learning model."""
        # Prepare features
        X = self._prepare_features_for_demand(features)
        
        # Scale features
        X_scaled = self.scaler.transform(X)
        
        # Get prediction
        prediction = self.demand_model.predict(X_scaled)
        
        return float(prediction[0][0])

    async def _calculate_elasticity(self, features: Dict) -> float:
        """Calculate price elasticity using gradient boosting model."""
        # Prepare features
        X = self._prepare_features_for_elasticity(features)
        
        # Get prediction
        elasticity = self.elasticity_model.predict(X)
        
        return float(elasticity[0])

    async def _optimize_price(
        self,
        features: Dict,
        predicted_demand: float,
        elasticity: float,
        competitor_prices: List[float]
    ) -> float:
        """Optimize price using reinforcement learning model."""
        # Prepare state
        state = self._prepare_state(
            features,
            predicted_demand,
            elasticity,
            competitor_prices
        )
        
        # Get action from actor network
        action = self.price_optimizer["actor"].predict(state)
        
        # Convert action to price
        base_price = features["product_data"]["base_price"]
        price_range = features["product_data"]["price_range"]
        
        optimal_price = base_price * (1 + (action[0][0] - 0.5) * price_range)
        
        return optimal_price

    async def _apply_pricing_rules(
        self,
        product_id: str,
        optimal_price: float,
        user_id: Optional[str],
        context: Optional[Dict]
    ) -> Dict:
        """Apply business rules and constraints to optimal price."""
        # Get pricing rules
        rules = await self.db.get_pricing_rules(product_id)
        
        # Get product constraints
        constraints = await self.db.get_product_constraints(product_id)
        
        # Apply minimum margin
        min_price = constraints["cost"] * (1 + constraints["min_margin"])
        optimal_price = max(optimal_price, min_price)
        
        # Apply maximum discount
        max_discount = constraints["max_discount"]
        original_price = constraints["original_price"]
        min_allowed_price = original_price * (1 - max_discount)
        optimal_price = max(optimal_price, min_allowed_price)
        
        # Apply user-specific rules
        if user_id:
            user_rules = await self.db.get_user_pricing_rules(user_id)
            optimal_price = self._apply_user_rules(optimal_price, user_rules)
        
        # Calculate final price and metadata
        final_price = {
            "price": round(optimal_price, 2),
            "original_price": original_price,
            "discount_percentage": round(
                (original_price - optimal_price) / original_price * 100,
                1
            ),
            "valid_until": datetime.now() + timedelta(
                hours=self.config["price_validity_hours"]
            ),
            "reason": self._get_pricing_reason(
                optimal_price,
                original_price,
                constraints,
                context
            )
        }
        
        return final_price

    async def _log_pricing_decision(
        self,
        product_id: str,
        final_price: Dict,
        features: Dict,
        start_time: datetime
    ):
        """Log pricing decision for monitoring and analysis."""
        duration = (datetime.now() - start_time).total_seconds()
        
        # Prepare log data
        log_data = {
            "product_id": product_id,
            "timestamp": datetime.now().isoformat(),
            "final_price": final_price["price"],
            "original_price": final_price["original_price"],
            "discount_percentage": final_price["discount_percentage"],
            "processing_time": duration,
            "features": features
        }
        
        # Log to BigQuery
        table_id = f"{self.config['project_id']}.pricing_decisions"
        errors = self.bq_client.insert_rows_json(table_id, [log_data])
        
        if errors:
            await self.monitoring.log_error(
                Exception(f"Failed to log pricing decision: {errors}"),
                {
                    "service": "dynamic_pricing",
                    "operation": "log_pricing_decision",
                    "product_id": product_id
                }
            )
        
        # Log metrics
        await self.monitoring.log_metrics({
            "pricing_latency": duration,
            "price_change_percentage": final_price["discount_percentage"],
            "product_id": product_id,
            "timestamp": datetime.now().isoformat()
        })

    def _get_pricing_reason(
        self,
        optimal_price: float,
        original_price: float,
        constraints: Dict,
        context: Optional[Dict]
    ) -> str:
        """Get human-readable reason for pricing decision."""
        if optimal_price < original_price:
            if context and context.get("high_inventory", False):
                return "High inventory levels"
            elif context and context.get("competitive_pressure", False):
                return "Competitive pricing"
            else:
                return "Demand optimization"
        else:
            if context and context.get("low_inventory", False):
                return "Low inventory levels"
            elif context and context.get("high_demand", False):
                return "High demand"
            else:
                return "Market conditions"
