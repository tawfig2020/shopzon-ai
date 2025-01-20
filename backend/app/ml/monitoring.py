from google.cloud import monitoring_v3, bigquery
from typing import Dict, List
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class ModelMonitor:
    def __init__(self, config):
        self.config = config
        self.client = monitoring_v3.MetricServiceClient()
        self.project_name = f"projects/{config.vertex_ai_project}"
        self.bq_client = bigquery.Client()
    
    def create_metric_descriptor(self, metric_type: str, description: str):
        """Create a custom metric descriptor for model monitoring."""
        descriptor = monitoring_v3.MetricDescriptor()
        descriptor.type = f"custom.googleapis.com/{metric_type}"
        descriptor.metric_kind = monitoring_v3.MetricDescriptor.MetricKind.GAUGE
        descriptor.value_type = monitoring_v3.MetricDescriptor.ValueType.DOUBLE
        descriptor.description = description
        
        descriptor = self.client.create_metric_descriptor(
            name=self.project_name,
            metric_descriptor=descriptor
        )
        return descriptor
    
    def log_metric(self, metric_type: str, value: float, labels: Dict[str, str] = None):
        """Log a metric value to Cloud Monitoring."""
        series = monitoring_v3.TimeSeries()
        series.metric.type = f"custom.googleapis.com/{metric_type}"
        if labels:
            series.metric.labels.update(labels)
            
        point = monitoring_v3.Point()
        point.value.double_value = value
        point.interval.end_time.seconds = int(datetime.now().timestamp())
        series.points = [point]
        
        self.client.create_time_series(
            name=self.project_name,
            time_series=[series]
        )
    
    def analyze_model_performance(self, model_name: str, 
                                start_time: datetime,
                                end_time: datetime) -> Dict:
        """Analyze model performance metrics over time."""
        query = f"""
        SELECT
            timestamp,
            metric_name,
            metric_value
        FROM
            `{self.config.bigquery_dataset}.model_metrics`
        WHERE
            model_name = @model_name
            AND timestamp BETWEEN @start_time AND @end_time
        ORDER BY
            timestamp DESC
        """
        
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("model_name", "STRING", model_name),
                bigquery.ScalarQueryParameter("start_time", "TIMESTAMP", start_time),
                bigquery.ScalarQueryParameter("end_time", "TIMESTAMP", end_time),
            ]
        )
        
        df = self.bq_client.query(query, job_config=job_config).to_dataframe()
        
        # Calculate performance statistics
        stats = {
            'mean': df.groupby('metric_name')['metric_value'].mean().to_dict(),
            'std': df.groupby('metric_name')['metric_value'].std().to_dict(),
            'trend': self._calculate_trend(df)
        }
        
        return stats
    
    def _calculate_trend(self, df: pd.DataFrame) -> Dict[str, float]:
        """Calculate trend coefficients for each metric."""
        trends = {}
        for metric in df['metric_name'].unique():
            metric_df = df[df['metric_name'] == metric].sort_values('timestamp')
            x = np.arange(len(metric_df))
            y = metric_df['metric_value'].values
            trend = np.polyfit(x, y, deg=1)[0]
            trends[metric] = float(trend)
        return trends
    
    def check_data_drift(self, feature_name: str, 
                        reference_data: pd.DataFrame,
                        current_data: pd.DataFrame,
                        threshold: float = 0.1) -> Dict:
        """Check for data drift using statistical tests."""
        from scipy import stats
        
        # Perform Kolmogorov-Smirnov test
        ks_statistic, p_value = stats.ks_2samp(
            reference_data[feature_name],
            current_data[feature_name]
        )
        
        drift_detected = p_value < threshold
        
        if drift_detected:
            self.log_metric(
                'data_drift',
                ks_statistic,
                {'feature': feature_name}
            )
        
        return {
            'feature': feature_name,
            'drift_detected': drift_detected,
            'ks_statistic': float(ks_statistic),
            'p_value': float(p_value)
        }
    
    def monitor_prediction_quality(self, predictions: List[float],
                                 actuals: List[float],
                                 model_name: str):
        """Monitor prediction quality metrics."""
        from sklearn.metrics import mean_squared_error, mean_absolute_error
        
        mse = mean_squared_error(actuals, predictions)
        mae = mean_absolute_error(actuals, predictions)
        
        metrics = {
            'mse': mse,
            'mae': mae,
            'timestamp': datetime.now()
        }
        
        # Log metrics to BigQuery
        table_id = f"{self.config.bigquery_dataset}.prediction_metrics"
        rows_to_insert = [{
            'model_name': model_name,
            'metric_name': name,
            'metric_value': value,
            'timestamp': metrics['timestamp']
        } for name, value in metrics.items() if name != 'timestamp']
        
        errors = self.bq_client.insert_rows_json(table_id, rows_to_insert)
        if errors:
            print(f"Encountered errors while inserting rows: {errors}")
        
        # Check for performance degradation
        threshold = self.config.monitoring_config['alert_threshold']
        if mse > threshold:
            self.log_metric(
                'model_performance_degradation',
                mse,
                {'model_name': model_name}
            )
