terraform {
  required_version = ">= 1.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  # Optional: Remote state (uncomment for team collaboration)
  # backend "gcs" {
  #   bucket = "library-app-terraform-state"
  #   prefix = "terraform/state"
  # }
}

provider "google" {
  project               = var.project_id
  region                = "us-central1"
  billing_project       = var.project_id
  user_project_override = true
}

# Enable Google Books API
resource "google_project_service" "books_api" {
  service = "books.googleapis.com"

  disable_on_destroy = false
}

# Enable Cloud Firestore API
resource "google_project_service" "firestore" {
  service = "firestore.googleapis.com"

  disable_on_destroy = false
}

# Enable Identity Toolkit API (Firebase Auth)
resource "google_project_service" "auth" {
  service = "identitytoolkit.googleapis.com"

  disable_on_destroy = false
}

# Enable Firebase Storage API
resource "google_project_service" "storage" {
  service = "storage.googleapis.com"

  disable_on_destroy = false
}

# Enable Cloud Vision API
resource "google_project_service" "vision_api" {
  service            = "vision.googleapis.com"
  disable_on_destroy = false
}

# Enable Cloud Functions API
resource "google_project_service" "cloudfunctions" {
  service            = "cloudfunctions.googleapis.com"
  disable_on_destroy = false
}

# Enable Cloud Build API (required for Cloud Functions)
resource "google_project_service" "cloudbuild" {
  service            = "cloudbuild.googleapis.com"
  disable_on_destroy = false
}

# Enable Cloud Run API (required for 2nd gen Cloud Functions)
resource "google_project_service" "cloudrun" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

# API Key with restrictions
# Manages the Firebase auto-generated key
resource "google_apikeys_key" "library_app" {
  name         = "7033abd1-016e-4bf3-b9bb-61cdb5aca4f7"
  display_name = "Library App Frontend (Terraform managed)"

  restrictions {
    browser_key_restrictions {
      allowed_referrers = concat(
        [
          "http://localhost/*",
          "localhost:*/*",
          "https://library-app-d4987.firebaseapp.com/*",
          "https://*.vercel.app/*"
        ],
        var.vercel_domain != "" ? ["https://${var.vercel_domain}/*"] : []
      )
    }

    # Books API for ISBN lookup
    api_targets {
      service = "books.googleapis.com"
    }

    # Firestore (uses both firestore and datastore APIs)
    api_targets {
      service = "firestore.googleapis.com"
    }
    api_targets {
      service = "datastore.googleapis.com"
    }

    # Firebase Auth (uses both identity toolkit and secure token)
    api_targets {
      service = "identitytoolkit.googleapis.com"
    }
    api_targets {
      service = "securetoken.googleapis.com"
    }

    # General Firebase
    api_targets {
      service = "firebase.googleapis.com"
    }

    # Firebase Storage
    api_targets {
      service = "storage.googleapis.com"
    }
  }
}
