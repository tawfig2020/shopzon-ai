from typing import Dict, List, Optional, Any
from datetime import datetime
import numpy as np
from scipy import stats
from google.cloud import bigquery
from pydantic import BaseModel
import asyncio
from ..monitoring import MonitoringService

class Experiment(BaseModel):
    """Model for A/B test experiment."""
    id: str
    name: str
    description: str
    variants: List[str]
    metrics: List[str]
    start_date: datetime
    end_date: Optional[datetime]
    status: str = "active"
    traffic_split: Dict[str, float]
    minimum_sample_size: int
    confidence_level: float = 0.95

class ExperimentResult(BaseModel):
    """Model for A/B test results."""
    experiment_id: str
    variant: str
    metric: str
    sample_size: int
    mean: float
    std_dev: float
    confidence_interval: tuple
    p_value: float
    is_significant: bool

class ABTestingService:
    def __init__(self):
        self.bq_client = bigquery.Client()
        self.monitoring = MonitoringService()
        self.active_experiments: Dict[str, Experiment] = {}

    async def create_experiment(self, experiment: Experiment) -> str:
        """Create a new A/B test experiment."""
        try:
            # Validate experiment configuration
            self._validate_experiment(experiment)
            
            # Store experiment configuration
            await self._store_experiment(experiment)
            
            # Initialize monitoring
            await self._init_experiment_monitoring(experiment)
            
            self.active_experiments[experiment.id] = experiment
            return experiment.id
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "ab_testing",
                "operation": "create_experiment",
                "experiment_id": experiment.id
            })
            raise

    def _validate_experiment(self, experiment: Experiment):
        """Validate experiment configuration."""
        # Check traffic split sums to 1
        if abs(sum(experiment.traffic_split.values()) - 1.0) > 0.001:
            raise ValueError("Traffic split must sum to 1")
        
        # Check minimum sample size
        if experiment.minimum_sample_size < 100:
            raise ValueError("Minimum sample size must be at least 100")
        
        # Check confidence level
        if not 0 < experiment.confidence_level < 1:
            raise ValueError("Confidence level must be between 0 and 1")

    async def _store_experiment(self, experiment: Experiment):
        """Store experiment configuration in BigQuery."""
        table_id = f"{self.project_id}.experiments.experiment_configs"
        
        rows_to_insert = [{
            "experiment_id": experiment.id,
            "name": experiment.name,
            "description": experiment.description,
            "variants": experiment.variants,
            "metrics": experiment.metrics,
            "start_date": experiment.start_date.isoformat(),
            "end_date": experiment.end_date.isoformat() if experiment.end_date else None,
            "status": experiment.status,
            "traffic_split": experiment.traffic_split,
            "minimum_sample_size": experiment.minimum_sample_size,
            "confidence_level": experiment.confidence_level
        }]
        
        errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            raise Exception(f"Failed to store experiment: {errors}")

    async def assign_variant(self, experiment_id: str, user_id: str) -> str:
        """Assign a variant to a user based on traffic split."""
        try:
            experiment = self.active_experiments.get(experiment_id)
            if not experiment:
                raise ValueError(f"Experiment {experiment_id} not found")
            
            # Deterministic assignment based on user_id
            hash_value = hash(f"{experiment_id}:{user_id}") % 100
            cumulative_prob = 0
            
            for variant, split in experiment.traffic_split.items():
                cumulative_prob += split * 100
                if hash_value < cumulative_prob:
                    await self._log_assignment(experiment_id, user_id, variant)
                    return variant
            
            # Fallback to control variant
            return experiment.variants[0]
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "ab_testing",
                "operation": "assign_variant",
                "experiment_id": experiment_id,
                "user_id": user_id
            })
            raise

    async def track_event(self, experiment_id: str, user_id: str, 
                         event_type: str, value: float):
        """Track an event for an experiment."""
        try:
            table_id = f"{self.project_id}.experiments.experiment_events"
            
            rows_to_insert = [{
                "experiment_id": experiment_id,
                "user_id": user_id,
                "event_type": event_type,
                "value": value,
                "timestamp": datetime.utcnow().isoformat()
            }]
            
            errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
            if errors:
                raise Exception(f"Failed to track event: {errors}")
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "ab_testing",
                "operation": "track_event",
                "experiment_id": experiment_id,
                "user_id": user_id
            })
            raise

    async def analyze_experiment(self, experiment_id: str) -> List[ExperimentResult]:
        """Analyze experiment results."""
        try:
            experiment = self.active_experiments.get(experiment_id)
            if not experiment:
                raise ValueError(f"Experiment {experiment_id} not found")
            
            results = []
            control_variant = experiment.variants[0]
            
            for metric in experiment.metrics:
                # Get metric data from BigQuery
                query = f"""
                SELECT
                    variant,
                    COUNT(*) as sample_size,
                    AVG(value) as mean,
                    STDDEV(value) as std_dev
                FROM `{self.project_id}.experiments.experiment_events`
                WHERE experiment_id = @experiment_id
                    AND event_type = @metric
                GROUP BY variant
                """
                
                query_params = [
                    bigquery.ScalarQueryParameter("experiment_id", "STRING", experiment_id),
                    bigquery.ScalarQueryParameter("metric", "STRING", metric)
                ]
                
                job_config = bigquery.QueryJobConfig(query_parameters=query_params)
                query_result = self.bq_client.query(query, job_config=job_config)
                
                # Calculate statistical significance
                variant_data = {}
                for row in query_result:
                    variant_data[row.variant] = {
                        "sample_size": row.sample_size,
                        "mean": row.mean,
                        "std_dev": row.std_dev
                    }
                
                control_data = variant_data[control_variant]
                
                for variant in experiment.variants[1:]:
                    if variant in variant_data:
                        test_data = variant_data[variant]
                        
                        # Calculate t-test
                        t_stat, p_value = stats.ttest_ind_from_stats(
                            mean1=control_data["mean"],
                            std1=control_data["std_dev"],
                            nobs1=control_data["sample_size"],
                            mean2=test_data["mean"],
                            std2=test_data["std_dev"],
                            nobs2=test_data["sample_size"]
                        )
                        
                        # Calculate confidence interval
                        ci = stats.t.interval(
                            experiment.confidence_level,
                            test_data["sample_size"] - 1,
                            test_data["mean"],
                            test_data["std_dev"] / np.sqrt(test_data["sample_size"])
                        )
                        
                        results.append(ExperimentResult(
                            experiment_id=experiment_id,
                            variant=variant,
                            metric=metric,
                            sample_size=test_data["sample_size"],
                            mean=test_data["mean"],
                            std_dev=test_data["std_dev"],
                            confidence_interval=ci,
                            p_value=p_value,
                            is_significant=p_value < (1 - experiment.confidence_level)
                        ))
            
            await self._store_results(experiment_id, results)
            return results
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "ab_testing",
                "operation": "analyze_experiment",
                "experiment_id": experiment_id
            })
            raise

    async def _store_results(self, experiment_id: str, results: List[ExperimentResult]):
        """Store experiment results in BigQuery."""
        table_id = f"{self.project_id}.experiments.experiment_results"
        
        rows_to_insert = [{
            "experiment_id": result.experiment_id,
            "variant": result.variant,
            "metric": result.metric,
            "sample_size": result.sample_size,
            "mean": result.mean,
            "std_dev": result.std_dev,
            "confidence_interval_lower": result.confidence_interval[0],
            "confidence_interval_upper": result.confidence_interval[1],
            "p_value": result.p_value,
            "is_significant": result.is_significant,
            "timestamp": datetime.utcnow().isoformat()
        } for result in results]
        
        errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            raise Exception(f"Failed to store results: {errors}")

    async def stop_experiment(self, experiment_id: str):
        """Stop an active experiment."""
        try:
            experiment = self.active_experiments.get(experiment_id)
            if not experiment:
                raise ValueError(f"Experiment {experiment_id} not found")
            
            experiment.status = "completed"
            experiment.end_date = datetime.utcnow()
            
            await self._store_experiment(experiment)
            del self.active_experiments[experiment_id]
            
            # Analyze final results
            results = await self.analyze_experiment(experiment_id)
            
            # Log experiment completion
            await self.monitoring.log_event(
                "experiment_completed",
                {
                    "experiment_id": experiment_id,
                    "duration_days": (experiment.end_date - experiment.start_date).days,
                    "results": results
                }
            )
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "ab_testing",
                "operation": "stop_experiment",
                "experiment_id": experiment_id
            })
            raise
