from google.cloud import bigquery
from google.cloud import monitoring_v3
from typing import Dict, List, Optional
import pandas as pd
from datetime import datetime, timedelta
from .config import BigQueryConfig, MonitoringConfig

class AnalyticsService:
    def __init__(self, config: MonitoringConfig):
        self.config = config
        self.bq_client = bigquery.Client()
        self.monitoring_client = monitoring_v3.MetricServiceClient()
        self.project_name = f"projects/{config.bigquery.project_id}"

    async def get_business_metrics(self, start_time: datetime, end_time: datetime) -> Dict:
        """Get key business metrics from BigQuery."""
        query = f"""
        WITH sales_data AS (
            SELECT
                DATE(timestamp) as date,
                COUNT(DISTINCT order_id) as total_orders,
                COUNT(DISTINCT user_id) as unique_users,
                SUM(order_value) as total_revenue
            FROM `{self.config.bigquery.dataset_id}.sales_metrics`
            WHERE timestamp BETWEEN @start_time AND @end_time
            GROUP BY DATE(timestamp)
        )
        SELECT
            AVG(total_revenue / total_orders) as average_order_value,
            SUM(total_revenue) / COUNT(DISTINCT unique_users) as customer_lifetime_value,
            COUNT(DISTINCT order_id) / COUNT(DISTINCT user_id) as conversion_rate
        FROM sales_data
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("start_time", "TIMESTAMP", start_time),
                bigquery.ScalarQueryParameter("end_time", "TIMESTAMP", end_time),
            ]
        )

        df = await self.bq_client.query(query, job_config=job_config).to_dataframe()
        return df.to_dict(orient='records')[0]

    async def get_ai_performance_metrics(self, start_time: datetime, end_time: datetime) -> Dict:
        """Get AI agent performance metrics."""
        query = f"""
        SELECT
            agent_type,
            AVG(response_time) as avg_response_time,
            AVG(accuracy) as avg_accuracy,
            COUNT(CASE WHEN status = 'error' THEN 1 END) / COUNT(*) as error_rate
        FROM `{self.config.bigquery.dataset_id}.agent_metrics`
        WHERE timestamp BETWEEN @start_time AND @end_time
        GROUP BY agent_type
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("start_time", "TIMESTAMP", start_time),
                bigquery.ScalarQueryParameter("end_time", "TIMESTAMP", end_time),
            ]
        )

        df = await self.bq_client.query(query, job_config=job_config).to_dataframe()
        return df.to_dict(orient='records')

    async def get_customer_interaction_metrics(self, start_time: datetime, end_time: datetime) -> Dict:
        """Get customer interaction and feedback metrics."""
        query = f"""
        WITH feedback_data AS (
            SELECT
                DATE(timestamp) as date,
                AVG(satisfaction_score) as avg_satisfaction,
                COUNT(DISTINCT user_id) as total_users,
                COUNT(CASE WHEN sentiment = 'positive' THEN 1 END) / COUNT(*) as positive_sentiment_ratio
            FROM `{self.config.bigquery.dataset_id}.customer_feedback`
            WHERE timestamp BETWEEN @start_time AND @end_time
            GROUP BY DATE(timestamp)
        )
        SELECT
            AVG(avg_satisfaction) as overall_satisfaction,
            AVG(positive_sentiment_ratio) as positive_sentiment_rate,
            SUM(total_users) as total_users_with_feedback
        FROM feedback_data
        """

        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("start_time", "TIMESTAMP", start_time),
                bigquery.ScalarQueryParameter("end_time", "TIMESTAMP", end_time),
            ]
        )

        df = await self.bq_client.query(query, job_config=job_config).to_dataframe()
        return df.to_dict(orient='records')[0]

    async def get_system_performance_metrics(self, start_time: datetime, end_time: datetime) -> Dict:
        """Get system performance metrics from Cloud Monitoring."""
        metrics = {}
        
        for metric_type in self.config.metrics_config["performance_metrics"]:
            metric_path = f"custom.googleapis.com/{metric_type}"
            
            interval = monitoring_v3.TimeInterval({
                "start_time": {"seconds": int(start_time.timestamp())},
                "end_time": {"seconds": int(end_time.timestamp())}
            })

            results = self.monitoring_client.list_time_series(
                request={
                    "name": self.project_name,
                    "filter": f'metric.type = "{metric_path}"',
                    "interval": interval,
                    "view": monitoring_v3.ListTimeSeriesRequest.TimeSeriesView.FULL
                }
            )

            # Process and aggregate metrics
            metric_values = []
            for result in results:
                for point in result.points:
                    metric_values.append(point.value.double_value)

            metrics[metric_type] = {
                "average": sum(metric_values) / len(metric_values) if metric_values else 0,
                "max": max(metric_values) if metric_values else 0,
                "min": min(metric_values) if metric_values else 0
            }

        return metrics

    async def get_dashboard_data(self, time_range: str = "24h") -> Dict:
        """Get all metrics for dashboard display."""
        end_time = datetime.utcnow()
        
        if time_range == "24h":
            start_time = end_time - timedelta(days=1)
        elif time_range == "7d":
            start_time = end_time - timedelta(days=7)
        elif time_range == "30d":
            start_time = end_time - timedelta(days=30)
        else:
            raise ValueError("Invalid time range")

        return {
            "business_metrics": await self.get_business_metrics(start_time, end_time),
            "ai_performance": await self.get_ai_performance_metrics(start_time, end_time),
            "customer_interaction": await self.get_customer_interaction_metrics(start_time, end_time),
            "system_performance": await self.get_system_performance_metrics(start_time, end_time)
        }

    async def export_report(self, start_time: datetime, end_time: datetime, 
                          metrics: List[str], format: str = "csv") -> bytes:
        """Export analytics report in specified format."""
        data = {}
        
        for metric in metrics:
            if metric == "business":
                data["business"] = await self.get_business_metrics(start_time, end_time)
            elif metric == "ai":
                data["ai"] = await self.get_ai_performance_metrics(start_time, end_time)
            elif metric == "customer":
                data["customer"] = await self.get_customer_interaction_metrics(start_time, end_time)
            elif metric == "system":
                data["system"] = await self.get_system_performance_metrics(start_time, end_time)

        df = pd.DataFrame.from_dict(data, orient='index')
        
        if format == "csv":
            return df.to_csv(index=True)
        elif format == "json":
            return df.to_json(orient='records')
        else:
            raise ValueError("Unsupported export format")
