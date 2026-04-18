# Library - Personal Book Collection Manager

A mobile-first book tracking application with Firebase-backed storage and backend-owned Google Books lookups.

## Features

### Core Functionality
- Book collection management
- Barcode scanning for quick adds
- Fuzzy search across title, author, ISBN, and publisher
- Author grouping in the library view
- Firebase-backed persistence

### Data Management
- Load sample books for testing and demonstration

### Design
- Editorial/art deco-inspired UI
- Mobile-first responsive layout
- PWA install support

### Book Information
Each book can include title, author, ISBN, cover image, publication year, publisher, page count, and date added.

## Technology Stack

- Frontend: React + Vite
- Backend: Firebase Auth, Firestore, Storage, and callable Functions
- Search: Fuse.js for client-side library search plus backend Google Books lookup
- PWA: Web App Manifest

## Getting Started

### Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. Add books manually or by barcode scan.
2. Use ISBN auto-fill and cover search through authenticated backend functions.
3. Search, edit, and organize books in the main library UI.

## Deployment

### Frontend (Vercel)
Connect your GitHub repo and deploy automatically, or use Netlify/GitHub Pages.

### Keys And Secrets

- `VITE_FIREBASE_API_KEY` is only for Firebase web app initialization in `src/firebase/config.js`.
- The frontend does not call Google Books directly.
- `GOOGLE_BOOKS_API_KEY` is the server-side Google Books key used by callable Functions.
- Cloud Functions reads it from Secret Manager via `defineSecret('GOOGLE_BOOKS_API_KEY')` in `functions/src/googleBooksService.js`.
- Set the Functions secret with `firebase functions:secrets:set GOOGLE_BOOKS_API_KEY`.
- The underlying Google Cloud keys are managed in `terraform/main.tf`.

### Firebase Setup (One-time)

```bash
# Set server-side Google Books API key in Secret Manager
firebase functions:secrets:set GOOGLE_BOOKS_API_KEY
```

### Firebase Deployment

```bash
# Deploy everything
firebase deploy

# Deploy specific services
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only storage:rules

# Deploy multiple
firebase deploy --only functions,firestore:rules
```

### Local Development with Emulators

```bash
# Start all emulators (Firestore, Auth, Storage, Functions)
firebase emulators:start

# Run app against emulators
VITE_USE_EMULATOR=true npm run dev
```

Emulator UI: http://localhost:4000

## Notes

- Use `npm run dev:emulate` for local development when you need authenticated callable flows and Firebase emulators.
