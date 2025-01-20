from typing import Dict, List, Optional, Any
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
from datetime import datetime, timedelta
import asyncio
from google.cloud import bigquery
from ..monitoring import MonitoringService
from .model_registry import ModelRegistry

class FeatureEngineeringPipeline:
    def __init__(self, config: Dict):
        self.config = config
        self.monitoring = MonitoringService()
        self.model_registry = ModelRegistry(config)
        self.bq_client = bigquery.Client()
        
        # Initialize encoders
        self.label_encoders = {}
        self.tfidf = TfidfVectorizer(max_features=100)
        self.scaler = StandardScaler()
        
    async def create_feature_set(
        self,
        feature_set_name: str,
        start_date: datetime,
        end_date: datetime
    ) -> pd.DataFrame:
        """Create a feature set for model training."""
        try:
            # Extract raw data
            raw_data = await self._extract_raw_data(start_date, end_date)
            
            # Transform features
            features = await self._transform_features(raw_data)
            
            # Save feature set
            await self._save_feature_set(feature_set_name, features)
            
            return features
            
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "feature_engineering",
                "operation": "create_feature_set",
                "feature_set_name": feature_set_name
            })
            raise

    async def _extract_raw_data(
        self,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, pd.DataFrame]:
        """Extract raw data from various sources."""
        # User data
        user_query = f"""
        SELECT *
        FROM `{self.config['project_id']}.users.user_data`
        WHERE created_at BETWEEN @start_date AND @end_date
        """
        
        # Product data
        product_query = f"""
        SELECT *
        FROM `{self.config['project_id']}.products.product_data`
        WHERE created_at BETWEEN @start_date AND @end_date
        """
        
        # Interaction data
        interaction_query = f"""
        SELECT *
        FROM `{self.config['project_id']}.interactions.interaction_data`
        WHERE created_at BETWEEN @start_date AND @end_date
        """
        
        query_params = [
            bigquery.ScalarQueryParameter("start_date", "TIMESTAMP", start_date),
            bigquery.ScalarQueryParameter("end_date", "TIMESTAMP", end_date)
        ]
        
        # Execute queries
        user_data = await self._execute_query(user_query, query_params)
        product_data = await self._execute_query(product_query, query_params)
        interaction_data = await self._execute_query(interaction_query, query_params)
        
        return {
            "users": user_data,
            "products": product_data,
            "interactions": interaction_data
        }

    async def _transform_features(self, raw_data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Transform raw data into features."""
        # User features
        user_features = await self._create_user_features(raw_data["users"])
        
        # Product features
        product_features = await self._create_product_features(raw_data["products"])
        
        # Interaction features
        interaction_features = await self._create_interaction_features(
            raw_data["interactions"]
        )
        
        # Combine features
        features = pd.merge(
            interaction_features,
            user_features,
            on="user_id",
            how="left"
        )
        
        features = pd.merge(
            features,
            product_features,
            on="product_id",
            how="left"
        )
        
        # Scale numerical features
        numerical_cols = features.select_dtypes(include=[np.number]).columns
        features[numerical_cols] = self.scaler.fit_transform(features[numerical_cols])
        
        return features

    async def _create_user_features(self, user_data: pd.DataFrame) -> pd.DataFrame:
        """Create user-related features."""
        features = pd.DataFrame()
        
        # Basic user features
        features["user_id"] = user_data["user_id"]
        
        # Encode categorical features
        categorical_cols = ["country", "device_type", "user_segment"]
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
            features[f"{col}_encoded"] = self.label_encoders[col].fit_transform(
                user_data[col]
            )
        
        # Create numerical features
        features["account_age_days"] = (
            datetime.now() - pd.to_datetime(user_data["created_at"])
        ).dt.days
        
        # Create behavioral features
        features["total_orders"] = user_data["total_orders"]
        features["average_order_value"] = user_data["total_spend"] / user_data["total_orders"]
        features["return_rate"] = user_data["total_returns"] / user_data["total_orders"]
        
        return features

    async def _create_product_features(self, product_data: pd.DataFrame) -> pd.DataFrame:
        """Create product-related features."""
        features = pd.DataFrame()
        
        # Basic product features
        features["product_id"] = product_data["product_id"]
        
        # Text features
        text_features = self.tfidf.fit_transform(
            product_data["description"]
        ).toarray()
        
        for i in range(text_features.shape[1]):
            features[f"text_feature_{i}"] = text_features[:, i]
        
        # Categorical features
        categorical_cols = ["category", "brand", "supplier"]
        for col in categorical_cols:
            if col not in self.label_encoders:
                self.label_encoders[col] = LabelEncoder()
            features[f"{col}_encoded"] = self.label_encoders[col].fit_transform(
                product_data[col]
            )
        
        # Numerical features
        features["price"] = product_data["price"]
        features["inventory_level"] = product_data["inventory_count"]
        features["restock_time_days"] = product_data["restock_time_days"]
        
        # Engagement features
        features["view_count"] = product_data["view_count"]
        features["purchase_count"] = product_data["purchase_count"]
        features["average_rating"] = product_data["average_rating"]
        
        return features

    async def _create_interaction_features(
        self,
        interaction_data: pd.DataFrame
    ) -> pd.DataFrame:
        """Create interaction-related features."""
        features = pd.DataFrame()
        
        # Basic interaction features
        features["user_id"] = interaction_data["user_id"]
        features["product_id"] = interaction_data["product_id"]
        
        # Time-based features
        features["hour_of_day"] = pd.to_datetime(
            interaction_data["timestamp"]
        ).dt.hour
        features["day_of_week"] = pd.to_datetime(
            interaction_data["timestamp"]
        ).dt.dayofweek
        
        # Interaction type features
        interaction_types = pd.get_dummies(
            interaction_data["interaction_type"],
            prefix="interaction"
        )
        features = pd.concat([features, interaction_types], axis=1)
        
        # Aggregated features
        features["interaction_count"] = interaction_data.groupby(
            ["user_id", "product_id"]
        )["interaction_type"].transform("count")
        
        return features

    async def _save_feature_set(
        self,
        feature_set_name: str,
        features: pd.DataFrame
    ):
        """Save feature set to BigQuery."""
        table_id = f"{self.config['project_id']}.features.{feature_set_name}"
        
        # Convert DataFrame to rows
        rows_to_insert = features.to_dict("records")
        
        # Save to BigQuery
        errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            raise Exception(f"Failed to save feature set: {errors}")
        
        # Log feature set metadata
        await self._log_feature_set_metadata(
            feature_set_name,
            features.shape,
            list(features.columns)
        )

    async def _log_feature_set_metadata(
        self,
        feature_set_name: str,
        shape: tuple,
        columns: List[str]
    ):
        """Log feature set metadata to BigQuery."""
        table_id = f"{self.config['project_id']}.features.feature_set_metadata"
        
        rows_to_insert = [{
            "feature_set_name": feature_set_name,
            "num_rows": shape[0],
            "num_columns": shape[1],
            "columns": columns,
            "creation_time": datetime.utcnow().isoformat()
        }]
        
        errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            raise Exception(f"Failed to log feature set metadata: {errors}")

    async def _execute_query(
        self,
        query: str,
        query_params: List[bigquery.ScalarQueryParameter]
    ) -> pd.DataFrame:
        """Execute BigQuery query and return results as DataFrame."""
        query_job = self.bq_client.query(
            query,
            job_config=bigquery.QueryJobConfig(query_parameters=query_params)
        )
        
        return query_job.to_dataframe()
