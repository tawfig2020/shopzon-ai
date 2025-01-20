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

# Cloud SQL Instance
resource "google_sql_database_instance" "shopsync" {
  name             = "shopsync-db-instance"
  database_version = "POSTGRES_14"
  region           = var.region

  settings {
    tier = "db-f1-micro"
    
    backup_configuration {
      enabled    = true
      start_time = "02:00"
    }

    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "allow-app"
        value = var.app_ip_range
      }
    }
  }
}

# Cloud Storage Bucket
resource "google_storage_bucket" "media_storage" {
  name          = "${var.project_id}-media"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "SetStorageClass"
      storage_class = "NEARLINE"
    }
  }
}

# BigQuery Dataset
resource "google_bigquery_dataset" "analytics" {
  dataset_id    = "shopsync_analytics"
  friendly_name = "ShopSync Analytics"
  description   = "Dataset for ShopSync AI analytics and user behavior tracking"
  location      = var.region

  default_table_expiration_ms = 2592000000 # 30 days

  access {
    role          = "OWNER"
    user_by_email = var.admin_email
  }
}

# Cloud IAM Role Bindings
resource "google_project_iam_binding" "app_service_account" {
  project = var.project_id
  role    = "roles/cloudsql.client"

  members = [
    "serviceAccount:${var.service_account_email}",
  ]
}

# Cloud Run Service
resource "google_cloud_run_service" "app" {
  name     = "shopsync-app"
  location = var.region

  template {
    spec {
      containers {
        image = var.app_image
        
        env {
          name  = "DB_HOST"
          value = google_sql_database_instance.shopsync.connection_name
        }
        
        env {
          name  = "STORAGE_BUCKET"
          value = google_storage_bucket.media_storage.name
        }
      }
    }
  }
}
