variable "project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "library-app-d4987"
}

variable "vercel_domain" {
  description = "Vercel production domain (if different from wildcard)"
  type        = string
  default     = ""
}
