from dataclasses import dataclass
from typing import Dict, List, Optional
import os

@dataclass
class PrometheusConfig:
    port: int = 9090
    metrics_path: str = "/metrics"
    scrape_interval: str = "15s"
    evaluation_interval: str = "15s"

@dataclass
class GrafanaConfig:
    port: int = 3000
    admin_user: str = os.getenv("GRAFANA_ADMIN_USER", "admin")
    admin_password: str = os.getenv("GRAFANA_ADMIN_PASSWORD", "admin")
    datasources: List[str] = None

@dataclass
class ElasticsearchConfig:
    hosts: List[str] = None
    index_prefix: str = "shopsync"
    username: str = os.getenv("ES_USERNAME")
    password: str = os.getenv("ES_PASSWORD")

@dataclass
class BigQueryConfig:
    project_id: str = os.getenv("GCP_PROJECT_ID")
    dataset_id: str = "shopsync_analytics"
    location: str = "US"
    tables: Dict[str, str] = None

@dataclass
class MonitoringConfig:
    # Google Cloud Operations
    enable_cloud_monitoring: bool = True
    enable_error_reporting: bool = True
    enable_cloud_trace: bool = True
    sampling_rate: float = 0.5

    # Prometheus & Grafana
    prometheus: PrometheusConfig = PrometheusConfig()
    grafana: GrafanaConfig = GrafanaConfig()

    # ELK Stack
    elasticsearch: ElasticsearchConfig = ElasticsearchConfig(
        hosts=["http://localhost:9200"],
        index_prefix="shopsync"
    )

    # BigQuery Analytics
    bigquery: BigQueryConfig = BigQueryConfig(
        tables={
            "user_interactions": "user_interactions",
            "sales_metrics": "sales_metrics",
            "agent_metrics": "agent_metrics",
            "customer_feedback": "customer_feedback"
        }
    )

    # Metrics Configuration
    metrics_config: Dict = {
        "business_metrics": [
            "conversion_rate",
            "average_order_value",
            "customer_lifetime_value",
            "churn_rate"
        ],
        "performance_metrics": [
            "response_time",
            "error_rate",
            "cpu_usage",
            "memory_usage"
        ],
        "ai_metrics": [
            "recommendation_accuracy",
            "pricing_optimization_impact",
            "sentiment_analysis_accuracy",
            "agent_response_time"
        ]
    }

    # Alerting Configuration
    alerting_config: Dict = {
        "error_rate_threshold": 0.05,
        "response_time_threshold": 2000,  # ms
        "cpu_usage_threshold": 80,  # percent
        "memory_usage_threshold": 85,  # percent
        "notification_channels": [
            "email",
            "slack",
            "pagerduty"
        ]
    }

    # Customer Interaction Config
    interaction_config: Dict = {
        "feedback_collection_interval": 7,  # days
        "satisfaction_survey_threshold": 10,  # purchases
        "chat_response_timeout": 30,  # seconds
        "max_chat_queue_size": 100
    }

    # Dashboard Configuration
    dashboard_config: Dict = {
        "refresh_interval": 60,  # seconds
        "default_time_range": "24h",
        "chart_types": [
            "line",
            "bar",
            "pie",
            "heatmap"
        ],
        "available_metrics": [
            "revenue",
            "users",
            "orders",
            "conversion"
        ]
    }
