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

# SSL Certificate
resource "google_compute_managed_ssl_certificate" "default" {
  name = "shopsync-ssl-cert"
  managed {
    domains = [var.domain_name]
  }
}

# Cloud Load Balancer
resource "google_compute_global_forwarding_rule" "default" {
  name                  = "shopsync-lb"
  target                = google_compute_target_https_proxy.default.id
  port_range           = "443"
  load_balancing_scheme = "EXTERNAL"
}

resource "google_compute_target_https_proxy" "default" {
  name             = "shopsync-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

resource "google_compute_url_map" "default" {
  name            = "shopsync-url-map"
  default_service = google_compute_backend_service.default.id
}

resource "google_compute_backend_service" "default" {
  name                  = "shopsync-backend"
  protocol              = "HTTPS"
  port_name             = "https"
  load_balancing_scheme = "EXTERNAL"
  timeout_sec           = 30
  health_checks        = [google_compute_health_check.default.id]
  backend {
    group = google_compute_instance_group_manager.default.instance_group
  }
  security_policy = google_compute_security_policy.policy.id
}

# WAF Security Policy
resource "google_compute_security_policy" "policy" {
  name = "shopsync-waf-policy"

  # XSS Protection
  rule {
    action   = "deny(403)"
    priority = "1000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('xss-stable')"
      }
    }
    description = "XSS protection"
  }

  # SQL Injection Protection
  rule {
    action   = "deny(403)"
    priority = "2000"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-stable')"
      }
    }
    description = "SQL injection protection"
  }

  # Rate Limiting
  rule {
    action   = "rate_based_ban"
    priority = "3000"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
    rate_limit_options {
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      conform_action = "allow"
      exceed_action  = "deny(429)"
    }
    description = "Rate limiting"
  }
}

# Firewall Rules
resource "google_compute_firewall" "allow_internal" {
  name    = "allow-internal"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["0-65535"]
  }

  source_ranges = ["10.0.0.0/8"]
}

resource "google_compute_firewall" "allow_health_check" {
  name    = "allow-health-check"
  network = "default"

  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }

  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  target_tags   = ["load-balanced-backend"]
}

# IAM Roles and Permissions
resource "google_project_iam_custom_role" "api_user" {
  role_id     = "apiUser"
  title       = "API User"
  description = "Custom role for API users"
  permissions = [
    "aiplatform.endpoints.predict",
    "aiplatform.models.get",
    "monitoring.timeSeries.list",
    "logging.logEntries.create"
  ]
}

resource "google_project_iam_custom_role" "model_admin" {
  role_id     = "modelAdmin"
  title       = "Model Administrator"
  description = "Custom role for model administrators"
  permissions = [
    "aiplatform.models.create",
    "aiplatform.models.delete",
    "aiplatform.models.update",
    "aiplatform.endpoints.create",
    "aiplatform.endpoints.delete",
    "aiplatform.endpoints.update"
  ]
}

# OAuth Configuration
resource "google_oauth_client" "web" {
  name = "shopsync-oauth"
  redirect_uris = [
    "https://${var.domain_name}/oauth/callback",
    "http://localhost:3000/oauth/callback"
  ]
  javascript_origins = [
    "https://${var.domain_name}",
    "http://localhost:3000"
  ]
}

# Secret Manager
resource "google_secret_manager_secret" "oauth_client" {
  secret_id = "oauth-client-secret"
  replication {
    automatic = true
  }
}

resource "google_secret_manager_secret_version" "oauth_client" {
  secret      = google_secret_manager_secret.oauth_client.id
  secret_data = google_oauth_client.web.client_secret
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

variable "domain_name" {
  description = "Domain name for SSL certificate"
  type        = string
}

# Outputs
output "load_balancer_ip" {
  value = google_compute_global_forwarding_rule.default.ip_address
}

output "oauth_client_id" {
  value = google_oauth_client.web.client_id
}

output "ssl_certificate_id" {
  value = google_compute_managed_ssl_certificate.default.id
}
