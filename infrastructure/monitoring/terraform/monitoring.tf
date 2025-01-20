terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Monitoring Workspace
resource "google_monitoring_workspace" "workspace" {
  display_name = "ShopSyncAI Monitoring"
  project      = var.project_id
}

# Monitoring Dashboard
resource "google_monitoring_dashboard" "dashboard" {
  dashboard_json = jsonencode({
    displayName = "ShopSyncAI System Dashboard"
    gridLayout = {
      columns = "2"
      widgets = [
        {
          title = "System Health"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"custom.googleapis.com/system/health\""
                }
              }
            }]
          }
        },
        {
          title = "Error Rate"
          xyChart = {
            dataSets = [{
              timeSeriesQuery = {
                timeSeriesFilter = {
                  filter = "metric.type=\"custom.googleapis.com/system/error_rate\""
                }
              }
            }]
          }
        }
      ]
    }
  })
}

# Alert Policies
resource "google_monitoring_alert_policy" "error_rate" {
  display_name = "High Error Rate Alert"
  combiner     = "OR"
  conditions {
    display_name = "Error Rate > 5%"
    condition_threshold {
      filter     = "metric.type=\"custom.googleapis.com/system/error_rate\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 0.05
    }
  }
  notification_channels = [google_monitoring_notification_channel.email.name]
}

resource "google_monitoring_alert_policy" "response_time" {
  display_name = "High Response Time Alert"
  combiner     = "OR"
  conditions {
    display_name = "Response Time > 2s"
    condition_threshold {
      filter     = "metric.type=\"custom.googleapis.com/system/response_time\""
      duration   = "300s"
      comparison = "COMPARISON_GT"
      threshold_value = 2000
    }
  }
  notification_channels = [google_monitoring_notification_channel.email.name]
}

# Notification Channels
resource "google_monitoring_notification_channel" "email" {
  display_name = "Email Notification Channel"
  type         = "email"
  labels = {
    email_address = var.alert_email
  }
}

# Log Sinks
resource "google_logging_project_sink" "bigquery_sink" {
  name        = "bigquery-sink"
  destination = "bigquery.googleapis.com/projects/${var.project_id}/datasets/${google_bigquery_dataset.logs.dataset_id}"
  filter      = "resource.type = \"gce_instance\""

  unique_writer_identity = true
}

# BigQuery Dataset for Logs
resource "google_bigquery_dataset" "logs" {
  dataset_id  = "shopsync_logs"
  description = "Dataset for ShopSyncAI system logs"
  location    = var.region

  labels = {
    env = "production"
  }
}

# Cloud Storage Bucket for Logs Archive
resource "google_storage_bucket" "logs_archive" {
  name     = "${var.project_id}-logs-archive"
  location = var.region

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}

# Prometheus and Grafana GKE deployment
resource "google_container_cluster" "monitoring" {
  name     = "monitoring-cluster"
  location = var.region

  initial_node_count = 1

  node_config {
    machine_type = "e2-medium"
    oauth_scopes = [
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring",
    ]
  }
}

# Variables
variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
}

# Outputs
output "cluster_endpoint" {
  value = google_container_cluster.monitoring.endpoint
}

output "monitoring_workspace" {
  value = google_monitoring_workspace.workspace.name
}

output "bigquery_dataset" {
  value = google_bigquery_dataset.logs.dataset_id
}

output "logs_bucket" {
  value = google_storage_bucket.logs_archive.name
}
