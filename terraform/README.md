# Terraform Infrastructure for Library App

## Prerequisites
- Terraform >= 1.0
- gcloud CLI authenticated with project access
- Owner/Editor role on project library-app-d4987

## Initial Setup

1. Install Terraform:
   ```bash
   brew install terraform
   ```

2. Authenticate with Google Cloud:
   ```bash
   gcloud auth application-default login
   gcloud config set project library-app-d4987
   ```

3. Initialize Terraform:
   ```bash
   npm run tf:init
   ```

4. Find existing API key ID:
   ```bash
   gcloud alpha services api-keys list --project=library-app-d4987 --format="table(name,displayName,createTime)"
   ```
   Copy the NAME value (format: `projects/167376846583/locations/global/keys/XXXXX`)

5. Import existing resources (see Import Commands below)

6. Verify plan matches current state:
   ```bash
   npm run tf:plan
   ```
   Should show "No changes" if import was successful

## Import Commands

Run these to import existing resources into Terraform state:

### Import API Services
```bash
cd terraform
terraform import google_project_service.books_api library-app-d4987/books.googleapis.com
terraform import google_project_service.firestore library-app-d4987/firestore.googleapis.com
terraform import google_project_service.auth library-app-d4987/identitytoolkit.googleapis.com
```

### Import API Key
First, get the full resource name from step 4 above, then import (replace KEY_ID):
```bash
terraform import google_apikeys_key.library_app projects/167376846583/locations/global/keys/KEY_ID
```

## Usage

### Plan changes
```bash
npm run tf:plan
```

### Apply changes
```bash
npm run tf:apply
```

### View API key value
```bash
npm run tf:output
```
Or for raw value:
```bash
cd terraform && terraform output -raw api_key_value
```

### Add new API
1. Add resource in main.tf
2. Run `npm run tf:plan`
3. Run `npm run tf:apply`

### Update API key restrictions
1. Modify `google_apikeys_key.library_app` in main.tf
2. Run `npm run tf:apply`

## Common Tasks

**Add new API:**
```hcl
resource "google_project_service" "new_api" {
  service = "newapi.googleapis.com"
  disable_on_destroy = false
}
```

**Update allowed referrers:**
Edit `browser_key_restrictions.allowed_referrers` in main.tf

**Add API to key restrictions:**
Add new `api_targets` block in main.tf

## State Management

### Current: Local State
- State stored in `terraform/terraform.tfstate` (gitignored)
- Works for single developer
- Backup state file regularly

### Future: Remote State (for team)
Uncomment backend block in main.tf and create GCS bucket:
```bash
gsutil mb -p library-app-d4987 gs://library-app-terraform-state
cd terraform
terraform init -migrate-state
```

## Security Notes

- Terraform state contains sensitive data (API keys)
- Keep `terraform.tfstate` out of git (.gitignore)
- Use remote state with encryption for team projects
- API key restrictions enforce security at Google Cloud level

## Verification

After applying:
1. Run `npm run tf:output` to see managed resources
2. Check Google Cloud Console → APIs & Services
3. Verify API key restrictions in Console
4. Test app: scan book, verify no 429 errors
