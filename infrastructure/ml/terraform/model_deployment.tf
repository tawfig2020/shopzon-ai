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

# Vertex AI Model Registry
resource "google_vertex_ai_model" "recommender" {
  display_name = "recommender-model"
  artifact_uri = var.recommender_model_uri
  container_spec {
    image_uri = "gcr.io/${var.project_id}/recommender:latest"
    command   = ["python", "serve.py"]
    env {
      name  = "MODEL_NAME"
      value = "recommender"
    }
    ports {
      container_port = 8080
    }
  }
}

resource "google_vertex_ai_model" "pricing" {
  display_name = "pricing-model"
  artifact_uri = var.pricing_model_uri
  container_spec {
    image_uri = "gcr.io/${var.project_id}/pricing:latest"
    command   = ["python", "serve.py"]
    env {
      name  = "MODEL_NAME"
      value = "pricing"
    }
    ports {
      container_port = 8080
    }
  }
}

# Vertex AI Endpoints
resource "google_vertex_ai_endpoint" "recommender" {
  display_name = "recommender-endpoint"
  location     = var.region
  network      = "projects/${var.project_id}/global/networks/default"

  deployed_models {
    model        = google_vertex_ai_model.recommender.id
    display_name = "recommender-model"
    dedicated_resources {
      machine_spec {
        machine_type = "n1-standard-4"
        accelerator_type = "NVIDIA_TESLA_T4"
        accelerator_count = 1
      }
      min_replica_count = 1
      max_replica_count = 5
    }
  }
}

resource "google_vertex_ai_endpoint" "pricing" {
  display_name = "pricing-endpoint"
  location     = var.region
  network      = "projects/${var.project_id}/global/networks/default"

  deployed_models {
    model        = google_vertex_ai_model.pricing.id
    display_name = "pricing-model"
    dedicated_resources {
      machine_spec {
        machine_type = "n1-standard-4"
      }
      min_replica_count = 1
      max_replica_count = 3
    }
  }
}

# Model Monitoring
resource "google_vertex_ai_model_monitoring_job" "recommender" {
  display_name = "recommender-monitoring"
  location     = var.region
  
  model_deployment_monitoring_job_config {
    endpoint_name = google_vertex_ai_endpoint.recommender.name
    
    prediction_sampling_config {
      sampling_rate = 0.8
    }
    
    monitoring_config {
      monitoring_interval_days = 1
      target_field            = "prediction"
      feature_monitoring_config {
        target_field = "features"
        feature_keys = ["user_id", "product_id", "category"]
      }
    }
  }
}

resource "google_vertex_ai_model_monitoring_job" "pricing" {
  display_name = "pricing-monitoring"
  location     = var.region
  
  model_deployment_monitoring_job_config {
    endpoint_name = google_vertex_ai_endpoint.pricing.name
    
    prediction_sampling_config {
      sampling_rate = 0.8
    }
    
    monitoring_config {
      monitoring_interval_days = 1
      target_field            = "price"
      feature_monitoring_config {
        target_field = "features"
        feature_keys = ["product_id", "category", "market_data"]
      }
    }
  }
}

# Cloud Storage for Model Artifacts
resource "google_storage_bucket" "model_artifacts" {
  name     = "${var.project_id}-model-artifacts"
  location = var.region
  
  versioning {
    enabled = true
  }
  
  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}

# API Gateway
resource "google_api_gateway_api" "api" {
  provider = google-beta
  api_id   = "shopsync-api"
}

resource "google_api_gateway_api_config" "api_config" {
  provider      = google-beta
  api          = google_api_gateway_api.api.api_id
  api_config_id = "shopsync-api-config"

  openapi_documents {
    document {
      path = "spec.yaml"
      contents = base64encode(<<-EOF
        swagger: '2.0'
        info:
          title: ShopSync AI API
          version: 1.0.0
        paths:
          /predict/recommender:
            post:
              operationId: recommendProducts
              x-google-backend:
                address: ${google_vertex_ai_endpoint.recommender.name}
          /predict/pricing:
            post:
              operationId: getPricing
              x-google-backend:
                address: ${google_vertex_ai_endpoint.pricing.name}
        EOF
      )
    }
  }

  gateway_config {
    backend_config {
      google_service_account = google_service_account.api_gateway.email
    }
  }
}

resource "google_api_gateway_gateway" "gateway" {
  provider     = google-beta
  api_config   = google_api_gateway_api_config.api_config.id
  gateway_id   = "shopsync-gateway"
  display_name = "ShopSync API Gateway"
}

# Service Account for API Gateway
resource "google_service_account" "api_gateway" {
  account_id   = "api-gateway-sa"
  display_name = "API Gateway Service Account"
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

variable "recommender_model_uri" {
  description = "URI for recommender model artifacts"
  type        = string
}

variable "pricing_model_uri" {
  description = "URI for pricing model artifacts"
  type        = string
}

# Outputs
output "recommender_endpoint" {
  value = google_vertex_ai_endpoint.recommender.name
}

output "pricing_endpoint" {
  value = google_vertex_ai_endpoint.pricing.name
}

output "api_gateway_url" {
  value = google_api_gateway_gateway.gateway.default_hostname
}
