from typing import Dict, List, Optional
from datetime import datetime
import asyncio
from google.cloud import monitoring_v3
from google.cloud import error_reporting
from prometheus_client import Counter, Histogram, Gauge
from elasticsearch import AsyncElasticsearch
import aiohttp
import json
from .config import MonitoringConfig

class EnhancedMonitoringService:
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.monitoring_client = monitoring_v3.MetricServiceClient()
        self.error_client = error_reporting.Client()
        self.es = AsyncElasticsearch(hosts=config.elasticsearch.hosts)
        
        # Initialize Prometheus metrics
        self.init_prometheus_metrics()
        
        # Initialize alert channels
        self.init_alert_channels()

    def init_prometheus_metrics(self):
        """Initialize Prometheus metrics with detailed instrumentation."""
        # System Metrics
        self.system_metrics = {
            "cpu_usage": Gauge("cpu_usage_percent", "CPU usage percentage"),
            "memory_usage": Gauge("memory_usage_percent", "Memory usage percentage"),
            "disk_usage": Gauge("disk_usage_percent", "Disk usage percentage"),
            "network_latency": Histogram("network_latency_seconds", "Network latency in seconds"),
        }
        
        # Application Metrics
        self.app_metrics = {
            "request_duration": Histogram(
                "request_duration_seconds",
                "Request duration in seconds",
                ["endpoint", "method"]
            ),
            "request_count": Counter(
                "request_count_total",
                "Total request count",
                ["endpoint", "method", "status"]
            ),
            "active_users": Gauge(
                "active_users_total",
                "Number of active users"
            ),
        }
        
        # AI Model Metrics
        self.model_metrics = {
            "prediction_latency": Histogram(
                "model_prediction_latency_seconds",
                "Model prediction latency",
                ["model_name"]
            ),
            "prediction_accuracy": Gauge(
                "model_prediction_accuracy",
                "Model prediction accuracy",
                ["model_name"]
            ),
            "feature_drift": Gauge(
                "model_feature_drift",
                "Model feature drift score",
                ["model_name", "feature"]
            ),
        }
        
        # Business Metrics
        self.business_metrics = {
            "conversion_rate": Gauge(
                "conversion_rate_percent",
                "Conversion rate percentage"
            ),
            "revenue": Counter(
                "revenue_total",
                "Total revenue",
                ["product_category"]
            ),
            "customer_satisfaction": Gauge(
                "customer_satisfaction_score",
                "Customer satisfaction score"
            ),
        }

    def init_alert_channels(self):
        """Initialize alert notification channels."""
        self.alert_channels = {
            "email": self.send_email_alert,
            "slack": self.send_slack_alert,
            "pagerduty": self.send_pagerduty_alert
        }

    async def monitor_system_health(self):
        """Monitor overall system health with enhanced metrics."""
        while True:
            try:
                # Collect system metrics
                system_metrics = await self.collect_system_metrics()
                
                # Update Prometheus metrics
                self.system_metrics["cpu_usage"].set(system_metrics["cpu"])
                self.system_metrics["memory_usage"].set(system_metrics["memory"])
                self.system_metrics["disk_usage"].set(system_metrics["disk"])
                
                # Check thresholds and trigger alerts
                await self.check_health_thresholds(system_metrics)
                
                # Log to Elasticsearch
                await self.log_to_elasticsearch("system_health", system_metrics)
                
                await asyncio.sleep(60)  # Monitor every minute
            except Exception as e:
                await self.handle_monitoring_error(e)

    async def monitor_model_performance(self):
        """Monitor AI model performance and drift."""
        while True:
            try:
                # Collect model metrics
                model_metrics = await self.collect_model_metrics()
                
                # Update Prometheus metrics
                for model_name, metrics in model_metrics.items():
                    self.model_metrics["prediction_accuracy"].labels(
                        model_name=model_name
                    ).set(metrics["accuracy"])
                    
                    for feature, drift in metrics["feature_drift"].items():
                        self.model_metrics["feature_drift"].labels(
                            model_name=model_name,
                            feature=feature
                        ).set(drift)
                
                # Check for model drift
                await self.check_model_drift(model_metrics)
                
                # Log to Elasticsearch
                await self.log_to_elasticsearch("model_performance", model_metrics)
                
                await asyncio.sleep(300)  # Monitor every 5 minutes
            except Exception as e:
                await self.handle_monitoring_error(e)

    async def monitor_user_experience(self):
        """Monitor user experience and satisfaction metrics."""
        while True:
            try:
                # Collect UX metrics
                ux_metrics = await self.collect_ux_metrics()
                
                # Update Prometheus metrics
                self.business_metrics["customer_satisfaction"].set(
                    ux_metrics["satisfaction_score"]
                )
                
                # Check satisfaction thresholds
                await self.check_satisfaction_thresholds(ux_metrics)
                
                # Log to Elasticsearch
                await self.log_to_elasticsearch("user_experience", ux_metrics)
                
                await asyncio.sleep(300)  # Monitor every 5 minutes
            except Exception as e:
                await self.handle_monitoring_error(e)

    async def check_health_thresholds(self, metrics: Dict):
        """Check system health thresholds and trigger alerts."""
        alerts = []
        
        if metrics["cpu"] > self.config.alerting_config["cpu_threshold"]:
            alerts.append({
                "type": "system",
                "severity": "warning",
                "message": f"High CPU usage: {metrics['cpu']}%"
            })
        
        if metrics["memory"] > self.config.alerting_config["memory_threshold"]:
            alerts.append({
                "type": "system",
                "severity": "warning",
                "message": f"High memory usage: {metrics['memory']}%"
            })
        
        if metrics["error_rate"] > self.config.alerting_config["error_rate_threshold"]:
            alerts.append({
                "type": "system",
                "severity": "critical",
                "message": f"High error rate: {metrics['error_rate']}%"
            })
        
        for alert in alerts:
            await self.trigger_alert(alert)

    async def check_model_drift(self, metrics: Dict):
        """Check for model drift and trigger retraining if needed."""
        for model_name, model_metrics in metrics.items():
            if model_metrics["drift_score"] > self.config.alerting_config["drift_threshold"]:
                await self.trigger_alert({
                    "type": "model_drift",
                    "severity": "warning",
                    "message": f"Model drift detected for {model_name}",
                    "metadata": {
                        "model_name": model_name,
                        "drift_score": model_metrics["drift_score"]
                    }
                })
                
                # Trigger model retraining
                await self.trigger_model_retraining(model_name)

    async def trigger_alert(self, alert: Dict):
        """Trigger alerts through configured channels."""
        for channel in self.config.alerting_config["notification_channels"]:
            if channel in self.alert_channels:
                try:
                    await self.alert_channels[channel](alert)
                except Exception as e:
                    await self.handle_monitoring_error(e)

    async def send_slack_alert(self, alert: Dict):
        """Send alert to Slack."""
        async with aiohttp.ClientSession() as session:
            await session.post(
                self.config.alerting_config["slack_webhook_url"],
                json={
                    "text": f"*{alert['severity'].upper()}*: {alert['message']}",
                    "attachments": [{
                        "fields": [
                            {"title": k, "value": str(v), "short": True}
                            for k, v in alert.get("metadata", {}).items()
                        ]
                    }]
                }
            )

    async def send_email_alert(self, alert: Dict):
        """Send alert via email."""
        # Implement email sending logic
        pass

    async def send_pagerduty_alert(self, alert: Dict):
        """Send alert to PagerDuty."""
        async with aiohttp.ClientSession() as session:
            await session.post(
                self.config.alerting_config["pagerduty_api_url"],
                json={
                    "incident": {
                        "type": "incident",
                        "title": alert["message"],
                        "urgency": "high" if alert["severity"] == "critical" else "low",
                        "body": {
                            "type": "incident_body",
                            "details": json.dumps(alert.get("metadata", {}))
                        }
                    }
                }
            )

    async def log_to_elasticsearch(self, index: str, document: Dict):
        """Log metrics to Elasticsearch."""
        try:
            await self.es.index(
                index=f"{self.config.elasticsearch.index_prefix}_{index}",
                document={
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": document
                }
            )
        except Exception as e:
            await self.handle_monitoring_error(e)

    async def handle_monitoring_error(self, error: Exception):
        """Handle monitoring system errors."""
        try:
            # Log error to Error Reporting
            self.error_client.report_exception()
            
            # Log to Elasticsearch
            await self.log_to_elasticsearch("monitoring_errors", {
                "error_type": type(error).__name__,
                "error_message": str(error),
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Trigger alert for monitoring system failure
            await self.trigger_alert({
                "type": "monitoring_error",
                "severity": "critical",
                "message": f"Monitoring system error: {str(error)}"
            })
        except Exception as e:
            # If error handling fails, log to stderr as last resort
            print(f"Critical monitoring error: {str(e)}", file=sys.stderr)
