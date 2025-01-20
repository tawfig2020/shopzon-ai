from google.cloud import monitoring_v3
from google.cloud import error_reporting
from google.cloud.monitoring_v3 import AlertPolicy
from prometheus_client import start_http_server, Counter, Gauge, Histogram
from elasticsearch import Elasticsearch
from typing import Dict, List, Optional
import logging
from datetime import datetime
from .config import MonitoringConfig

class MonitoringService:
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.monitoring_client = monitoring_v3.MetricServiceClient()
        self.error_client = error_reporting.Client()
        
        # Initialize Elasticsearch
        if config.elasticsearch.hosts:
            self.es = Elasticsearch(
                hosts=config.elasticsearch.hosts,
                basic_auth=(config.elasticsearch.username, config.elasticsearch.password)
            )
        
        # Initialize Prometheus metrics
        self.init_prometheus_metrics()
        
        # Start Prometheus server
        start_http_server(config.prometheus.port)

    def init_prometheus_metrics(self):
        """Initialize Prometheus metrics."""
        self.request_counter = Counter(
            'http_requests_total',
            'Total HTTP requests',
            ['method', 'endpoint', 'status']
        )
        
        self.response_time = Histogram(
            'http_response_time_seconds',
            'HTTP response time in seconds',
            ['method', 'endpoint']
        )
        
        self.active_users = Gauge(
            'active_users',
            'Number of active users'
        )
        
        self.agent_processing_time = Histogram(
            'agent_processing_time_seconds',
            'Agent processing time in seconds',
            ['agent_type']
        )

    async def log_request(self, method: str, endpoint: str, 
                         status: int, duration: float):
        """Log HTTP request metrics."""
        self.request_counter.labels(method=method, endpoint=endpoint, 
                                  status=status).inc()
        self.response_time.labels(method=method, endpoint=endpoint).observe(duration)

    async def track_active_users(self, count: int):
        """Track number of active users."""
        self.active_users.set(count)

    async def log_agent_metrics(self, agent_type: str, duration: float, 
                              success: bool, metadata: Dict):
        """Log AI agent performance metrics."""
        self.agent_processing_time.labels(agent_type=agent_type).observe(duration)
        
        # Log to Cloud Monitoring
        metric_path = f"custom.googleapis.com/agent/{agent_type}/duration"
        await self.log_custom_metric(metric_path, duration, metadata)
        
        # Log to Elasticsearch
        doc = {
            "timestamp": datetime.utcnow(),
            "agent_type": agent_type,
            "duration": duration,
            "success": success,
            "metadata": metadata
        }
        await self.log_to_elasticsearch("agent_metrics", doc)

    async def log_custom_metric(self, metric_path: str, value: float, 
                              metadata: Dict = None):
        """Log custom metric to Cloud Monitoring."""
        series = monitoring_v3.TimeSeries()
        series.metric.type = metric_path
        if metadata:
            series.metric.labels.update(metadata)
            
        point = monitoring_v3.Point()
        point.value.double_value = value
        point.interval.end_time.seconds = int(datetime.now().timestamp())
        series.points = [point]
        
        self.monitoring_client.create_time_series(
            request={
                "name": f"projects/{self.config.bigquery.project_id}",
                "time_series": [series]
            }
        )

    async def log_to_elasticsearch(self, index: str, document: Dict):
        """Log document to Elasticsearch."""
        if self.es:
            index_name = f"{self.config.elasticsearch.index_prefix}_{index}"
            await self.es.index(index=index_name, document=document)

    async def create_alert_policy(self, name: str, filter_str: str, 
                                threshold: float, duration: str):
        """Create Cloud Monitoring alert policy."""
        alert_policy = AlertPolicy()
        alert_policy.display_name = name
        
        condition = monitoring_v3.AlertPolicy.Condition()
        condition.display_name = f"{name}_condition"
        condition.condition_threshold.filter = filter_str
        condition.condition_threshold.comparison = (
            monitoring_v3.AlertPolicy.Condition.ComparisonType.COMPARISON_GT
        )
        condition.condition_threshold.threshold_value = threshold
        condition.condition_threshold.duration = duration
        
        alert_policy.conditions = [condition]
        
        created_policy = self.monitoring_client.create_alert_policy(
            request={
                "name": f"projects/{self.config.bigquery.project_id}",
                "alert_policy": alert_policy
            }
        )
        return created_policy

    async def log_error(self, error: Exception, context: Dict = None):
        """Log error to Error Reporting."""
        self.error_client.report_exception()
        
        # Log to Elasticsearch
        error_doc = {
            "timestamp": datetime.utcnow(),
            "error_type": type(error).__name__,
            "error_message": str(error),
            "context": context or {}
        }
        await self.log_to_elasticsearch("errors", error_doc)

    async def get_system_health(self) -> Dict:
        """Get overall system health metrics."""
        # Query recent metrics from Prometheus
        health_metrics = {
            "request_rate": self.request_counter._value.sum(),
            "average_response_time": self.response_time._sum.sum() / self.response_time._count.sum(),
            "active_users": self.active_users._value,
            "error_rate": await self.calculate_error_rate()
        }
        
        # Add status based on thresholds
        health_metrics["status"] = "healthy"
        if (health_metrics["error_rate"] > self.config.alerting_config["error_rate_threshold"] or
            health_metrics["average_response_time"] > self.config.alerting_config["response_time_threshold"]):
            health_metrics["status"] = "degraded"
            
        return health_metrics

    async def calculate_error_rate(self) -> float:
        """Calculate current error rate."""
        total_requests = sum(self.request_counter.collect()[0].samples[0].value)
        error_requests = sum(
            sample.value for sample in self.request_counter.collect()[0].samples
            if sample.labels['status'].startswith('5')
        )
        return error_requests / total_requests if total_requests > 0 else 0

    async def cleanup(self):
        """Cleanup monitoring resources."""
        if self.es:
            await self.es.close()
