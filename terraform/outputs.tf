output "api_key_value" {
  description = "API Key for frontend use"
  value       = google_apikeys_key.library_app.key_string
  sensitive   = true
}

output "api_key_id" {
  description = "API Key resource ID"
  value       = google_apikeys_key.library_app.id
}

output "enabled_apis" {
  description = "List of enabled APIs"
  value = [
    google_project_service.books_api.service,
    google_project_service.firestore.service,
    google_project_service.auth.service
  ]
}
