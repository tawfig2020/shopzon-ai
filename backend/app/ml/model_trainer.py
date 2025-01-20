from typing import Dict, List, Optional, Any
import asyncio
from datetime import datetime, timedelta
import pandas as pd
from google.cloud import bigquery
from .model_registry import ModelRegistry
from .feature_engineering import FeatureEngineeringPipeline
from ..monitoring import MonitoringService

class ModelTrainer:
    def __init__(self, config: Dict):
        self.config = config
        self.monitoring = MonitoringService()
        self.model_registry = ModelRegistry(config)
        self.feature_pipeline = FeatureEngineeringPipeline(config)
        self.bq_client = bigquery.Client()
        
    async def train_model(
        self,
        model_name: str,
        model_type: str,
        training_config: Dict
    ) -> str:
        """Train a new model version."""
        try:
            # Create feature set
            features = await self.feature_pipeline.create_feature_set(
                feature_set_name=f"{model_name}_training_data",
                start_date=training_config["start_date"],
                end_date=training_config["end_date"]
            )
            
            # Split data
            train_data, val_data = self._split_data(
                features,
                training_config["validation_split"]
            )
            
            # Train model
            model, metrics = await self._train_model_by_type(
                model_type,
                train_data,
                val_data,
                training_config
            )
            
            # Register model
            model_version = await self.model_registry.register_model(
                model_name=model_name,
                model_version=datetime.now().strftime("%Y%m%d_%H%M%S"),
                model_type=model_type,
                model_artifacts={
                    "model": model,
                    "feature_pipeline": self.feature_pipeline
                },
                metrics=metrics,
                parameters=training_config
            )
            
            # Log training metrics
            await self._log_training_metrics(
                model_name,
                model_version,
                metrics
            )
            
            return model_version
            
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "model_trainer",
                "operation": "train_model",
                "model_name": model_name,
                "model_type": model_type
            })
            raise

    async def schedule_retraining(
        self,
        model_name: str,
        schedule_config: Dict
    ):
        """Schedule automated model retraining."""
        try:
            while True:
                # Check if retraining is needed
                if await self._should_retrain(model_name, schedule_config):
                    # Get current model version
                    current_version = await self.model_registry.get_model_version(
                        model_name,
                        stage="Production"
                    )
                    
                    # Get training config
                    training_config = await self._get_training_config(
                        model_name,
                        current_version
                    )
                    
                    # Train new model version
                    new_version = await self.train_model(
                        model_name=model_name,
                        model_type=current_version["model_type"],
                        training_config=training_config
                    )
                    
                    # Evaluate new model
                    if await self._evaluate_new_version(
                        model_name,
                        current_version["version"],
                        new_version
                    ):
                        # Transition to production if better
                        await self.model_registry.transition_model_stage(
                            model_name=model_name,
                            version=new_version,
                            stage="Production"
                        )
                    
                # Wait for next check
                await asyncio.sleep(schedule_config["check_interval_seconds"])
                
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "model_trainer",
                "operation": "schedule_retraining",
                "model_name": model_name
            })
            raise

    async def _should_retrain(self, model_name: str, schedule_config: Dict) -> bool:
        """Determine if model should be retrained."""
        try:
            # Get current model version
            current_version = await self.model_registry.get_model_version(
                model_name,
                stage="Production"
            )
            
            # Check time-based criteria
            time_since_training = datetime.now() - datetime.fromtimestamp(
                current_version["creation_timestamp"] / 1000.0
            )
            
            if time_since_training > timedelta(
                days=schedule_config["max_days_without_retraining"]
            ):
                return True
            
            # Check performance-based criteria
            recent_metrics = await self._get_recent_metrics(
                model_name,
                current_version["version"]
            )
            
            if recent_metrics["performance_drop"] > schedule_config["performance_threshold"]:
                return True
            
            # Check data drift
            if recent_metrics["data_drift_score"] > schedule_config["drift_threshold"]:
                return True
            
            return False
            
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "model_trainer",
                "operation": "_should_retrain",
                "model_name": model_name
            })
            raise

    async def _get_recent_metrics(self, model_name: str, version: str) -> Dict:
        """Get recent model performance metrics."""
        query = f"""
        WITH performance_metrics AS (
            SELECT
                AVG(metric_value) as avg_metric_value,
                STDDEV(metric_value) as std_metric_value
            FROM `{self.config['project_id']}.ml_metrics.model_metrics`
            WHERE model_name = @model_name
            AND model_version = @version
            AND metric_name = 'performance'
            AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
        ),
        baseline_metrics AS (
            SELECT
                AVG(metric_value) as baseline_value
            FROM `{self.config['project_id']}.ml_metrics.model_metrics`
            WHERE model_name = @model_name
            AND model_version = @version
            AND metric_name = 'performance'
            AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
            AND timestamp < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
        ),
        drift_metrics AS (
            SELECT
                AVG(metric_value) as drift_score
            FROM `{self.config['project_id']}.ml_metrics.model_metrics`
            WHERE model_name = @model_name
            AND model_version = @version
            AND metric_name = 'data_drift'
            AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
        )
        SELECT
            p.avg_metric_value,
            p.std_metric_value,
            b.baseline_value,
            d.drift_score,
            (b.baseline_value - p.avg_metric_value) / b.baseline_value as performance_drop
        FROM performance_metrics p
        CROSS JOIN baseline_metrics b
        CROSS JOIN drift_metrics d
        """
        
        query_params = [
            bigquery.ScalarQueryParameter("model_name", "STRING", model_name),
            bigquery.ScalarQueryParameter("version", "STRING", version)
        ]
        
        query_job = self.bq_client.query(
            query,
            job_config=bigquery.QueryJobConfig(query_parameters=query_params)
        )
        
        results = list(query_job)[0]
        
        return {
            "current_performance": results.avg_metric_value,
            "performance_std": results.std_metric_value,
            "baseline_performance": results.baseline_value,
            "performance_drop": results.performance_drop,
            "data_drift_score": results.drift_score
        }

    async def _evaluate_new_version(
        self,
        model_name: str,
        current_version: str,
        new_version: str
    ) -> bool:
        """Evaluate if new model version is better than current version."""
        # Get metrics for both versions
        current_metrics = await self._get_recent_metrics(
            model_name,
            current_version
        )
        
        new_metrics = await self._get_recent_metrics(
            model_name,
            new_version
        )
        
        # Compare performance
        performance_improvement = (
            new_metrics["current_performance"] -
            current_metrics["current_performance"]
        ) / current_metrics["current_performance"]
        
        # Check if improvement is statistically significant
        is_significant = (
            performance_improvement > 
            self.config["min_improvement_threshold"]
        )
        
        # Log evaluation results
        await self._log_evaluation_results(
            model_name,
            current_version,
            new_version,
            current_metrics,
            new_metrics,
            performance_improvement,
            is_significant
        )
        
        return is_significant

    async def _log_evaluation_results(
        self,
        model_name: str,
        current_version: str,
        new_version: str,
        current_metrics: Dict,
        new_metrics: Dict,
        improvement: float,
        is_significant: bool
    ):
        """Log model evaluation results."""
        table_id = f"{self.config['project_id']}.ml_metrics.model_evaluations"
        
        rows_to_insert = [{
            "model_name": model_name,
            "current_version": current_version,
            "new_version": new_version,
            "current_metrics": current_metrics,
            "new_metrics": new_metrics,
            "improvement": improvement,
            "is_significant": is_significant,
            "evaluation_time": datetime.utcnow().isoformat()
        }]
        
        errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            raise Exception(f"Failed to log evaluation results: {errors}")

    def _split_data(
        self,
        data: pd.DataFrame,
        validation_split: float
    ) -> tuple:
        """Split data into training and validation sets."""
        train_size = int(len(data) * (1 - validation_split))
        return data[:train_size], data[train_size:]
