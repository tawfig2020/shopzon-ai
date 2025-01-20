from typing import Dict, List, Optional, Any
import os
from datetime import datetime
import json
from google.cloud import storage
from google.cloud import bigquery
import mlflow
from mlflow.tracking import MlflowClient
import pandas as pd
from ..monitoring import MonitoringService

class ModelRegistry:
    def __init__(self, config: Dict):
        self.config = config
        self.monitoring = MonitoringService()
        self.storage_client = storage.Client()
        self.bq_client = bigquery.Client()
        self.mlflow_client = MlflowClient()
        
        # Initialize MLflow
        mlflow.set_tracking_uri(config["mlflow_tracking_uri"])
        
    async def register_model(
        self,
        model_name: str,
        model_version: str,
        model_type: str,
        model_artifacts: Dict[str, Any],
        metrics: Dict[str, float],
        parameters: Dict[str, Any]
    ) -> str:
        """Register a new model version in the registry."""
        try:
            # Start MLflow run
            with mlflow.start_run() as run:
                # Log metrics
                for metric_name, metric_value in metrics.items():
                    mlflow.log_metric(metric_name, metric_value)
                
                # Log parameters
                for param_name, param_value in parameters.items():
                    mlflow.log_param(param_name, str(param_value))
                
                # Log model artifacts
                artifact_uri = await self._save_model_artifacts(
                    model_name,
                    model_version,
                    model_artifacts
                )
                mlflow.log_artifact(artifact_uri)
                
                # Register model version
                model_uri = f"runs:/{run.info.run_id}/model"
                mv = mlflow.register_model(model_uri, model_name)
                
                # Update model version metadata
                self.mlflow_client.update_model_version(
                    name=model_name,
                    version=mv.version,
                    description=f"Model type: {model_type}, Version: {model_version}"
                )
                
                # Log to BigQuery
                await self._log_model_registration(
                    model_name=model_name,
                    model_version=model_version,
                    model_type=model_type,
                    metrics=metrics,
                    parameters=parameters,
                    artifact_uri=artifact_uri,
                    run_id=run.info.run_id
                )
                
                return mv.version
                
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "model_registry",
                "operation": "register_model",
                "model_name": model_name,
                "model_version": model_version
            })
            raise

    async def get_model_version(
        self,
        model_name: str,
        version: Optional[str] = None,
        stage: Optional[str] = None
    ) -> Dict:
        """Get model version details."""
        try:
            if version:
                model_version = self.mlflow_client.get_model_version(
                    name=model_name,
                    version=version
                )
            elif stage:
                model_version = self.mlflow_client.get_latest_versions(
                    name=model_name,
                    stages=[stage]
                )[0]
            else:
                model_version = self.mlflow_client.get_latest_versions(
                    name=model_name,
                    stages=["Production"]
                )[0]
            
            # Get run details
            run = self.mlflow_client.get_run(model_version.run_id)
            
            return {
                "model_name": model_name,
                "version": model_version.version,
                "stage": model_version.current_stage,
                "metrics": run.data.metrics,
                "parameters": run.data.params,
                "artifact_uri": model_version.source,
                "creation_timestamp": model_version.creation_timestamp
            }
            
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "model_registry",
                "operation": "get_model_version",
                "model_name": model_name,
                "version": version,
                "stage": stage
            })
            raise

    async def transition_model_stage(
        self,
        model_name: str,
        version: str,
        stage: str,
        archive_existing: bool = True
    ):
        """Transition a model version to a new stage."""
        try:
            # Archive existing versions in the target stage if requested
            if archive_existing:
                existing_versions = self.mlflow_client.get_latest_versions(
                    name=model_name,
                    stages=[stage]
                )
                for ev in existing_versions:
                    self.mlflow_client.transition_model_version_stage(
                        name=model_name,
                        version=ev.version,
                        stage="Archived"
                    )
            
            # Transition the specified version to the new stage
            self.mlflow_client.transition_model_version_stage(
                name=model_name,
                version=version,
                stage=stage
            )
            
            # Log the transition
            await self._log_model_transition(
                model_name=model_name,
                version=version,
                stage=stage
            )
            
        except Exception as e:
            await self.monitoring.log_error(e, {
                "service": "model_registry",
                "operation": "transition_model_stage",
                "model_name": model_name,
                "version": version,
                "stage": stage
            })
            raise

    async def _save_model_artifacts(
        self,
        model_name: str,
        model_version: str,
        artifacts: Dict[str, Any]
    ) -> str:
        """Save model artifacts to Cloud Storage."""
        bucket = self.storage_client.bucket(self.config["model_artifacts_bucket"])
        base_path = f"{model_name}/{model_version}"
        
        # Save each artifact
        for artifact_name, artifact_content in artifacts.items():
            blob = bucket.blob(f"{base_path}/{artifact_name}")
            
            if isinstance(artifact_content, (dict, list)):
                blob.upload_from_string(
                    json.dumps(artifact_content),
                    content_type="application/json"
                )
            else:
                blob.upload_from_string(str(artifact_content))
        
        return f"gs://{self.config['model_artifacts_bucket']}/{base_path}"

    async def _log_model_registration(
        self,
        model_name: str,
        model_version: str,
        model_type: str,
        metrics: Dict[str, float],
        parameters: Dict[str, Any],
        artifact_uri: str,
        run_id: str
    ):
        """Log model registration to BigQuery."""
        table_id = f"{self.config['project_id']}.ml_registry.model_versions"
        
        rows_to_insert = [{
            "model_name": model_name,
            "model_version": model_version,
            "model_type": model_type,
            "metrics": json.dumps(metrics),
            "parameters": json.dumps(parameters),
            "artifact_uri": artifact_uri,
            "run_id": run_id,
            "registration_time": datetime.utcnow().isoformat()
        }]
        
        errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            raise Exception(f"Failed to log model registration: {errors}")

    async def _log_model_transition(
        self,
        model_name: str,
        version: str,
        stage: str
    ):
        """Log model stage transition to BigQuery."""
        table_id = f"{self.config['project_id']}.ml_registry.model_transitions"
        
        rows_to_insert = [{
            "model_name": model_name,
            "model_version": version,
            "stage": stage,
            "transition_time": datetime.utcnow().isoformat()
        }]
        
        errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            raise Exception(f"Failed to log model transition: {errors}")

    async def get_model_lineage(self, model_name: str) -> List[Dict]:
        """Get the lineage of a model including all versions and transitions."""
        query = f"""
        WITH transitions AS (
            SELECT
                model_name,
                model_version,
                stage,
                transition_time
            FROM `{self.config['project_id']}.ml_registry.model_transitions`
            WHERE model_name = @model_name
        ),
        registrations AS (
            SELECT
                model_name,
                model_version,
                model_type,
                metrics,
                parameters,
                registration_time
            FROM `{self.config['project_id']}.ml_registry.model_versions`
            WHERE model_name = @model_name
        )
        SELECT
            r.*,
            t.stage,
            t.transition_time
        FROM registrations r
        LEFT JOIN transitions t
        ON r.model_name = t.model_name
        AND r.model_version = t.model_version
        ORDER BY r.registration_time DESC
        """
        
        query_params = [
            bigquery.ScalarQueryParameter("model_name", "STRING", model_name)
        ]
        
        query_job = self.bq_client.query(
            query,
            job_config=bigquery.QueryJobConfig(query_parameters=query_params)
        )
        
        return [dict(row) for row in query_job]
