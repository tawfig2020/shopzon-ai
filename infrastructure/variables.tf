variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "app_ip_range" {
  description = "IP range for application access"
  type        = string
}

variable "admin_email" {
  description = "Admin email for BigQuery access"
  type        = string
}

variable "service_account_email" {
  description = "Service account email for application"
  type        = string
}

variable "app_image" {
  description = "Container image for Cloud Run service"
  type        = string
}
