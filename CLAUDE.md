# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

In all interactions and commit messages, be extremely concise and sacrific grammar for the sake of concision.

## Build and Development Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run dev:emulate  # Dev server with Firebase emulators
npm run emulators    # Start Firebase emulators only
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run Playwright e2e tests
npm run test:ui      # Run tests with Playwright UI
npm run test:debug   # Run tests in debug mode
```

### Terraform (Infrastructure)
```bash
npm run tf:init      # Initialize Terraform
npm run tf:plan      # Plan infrastructure changes
npm run tf:apply     # Apply infrastructure changes
npm run tf:output    # Show Terraform outputs
```

Tests require the dev server running (Playwright config auto-starts it).

On the hamburger menu, there is "dev tools" > "load test data" functionality. Use that when test data is needed.

When developing, the preferred workflow is to run the dev server and visually verify changes using Playwright MCP. Iterate on results until they look good.

## Architecture

React + Vite personal book collection manager with Firebase backend. Mobile-first design with editorial/art deco aesthetic.

### Architecture Decisions
- **Firebase Firestore** for data persistence with offline support via persistentLocalCache
- **Firebase Auth** with Google sign-in for user authentication
- **Firebase Storage** for book cover images
- **Firebase Functions** for server-side operations (e.g., book cover recognition)
- **Vercel** hosting for accessibility from anywhere (phone, work computer) with GitHub integration
- **Terraform** for Firebase infrastructure provisioning

### Data Flow
- **useAuth hook** manages Firebase Auth state and Google sign-in
- **useBooks hook** manages Firestore real-time subscription for books
- **App.jsx** orchestrates UI state (modals, search) and passes hooks to components
- Books stored in Firestore at `users/{uid}/books/{bookId}`
- Fuzzy search uses Fuse.js across title, author, ISBN, and publisher fields

### Firestore Book Schema
```json
{
  "id": "uuid",
  "title": "Book Title",
  "author": "Author Name",
  "isbn": "1234567890",
  "coverUrl": "https://...",
  "publishYear": 2020,
  "publisher": "Publisher Name",
  "pageCount": 300,
  "dateAdded": "2026-01-19T..."
}
```

### Components
- **App.jsx** - Main orchestrator with modal visibility and search state
- **BookList.jsx** - Renders books grouped by author
- **BookCard.jsx** - Individual book display
- **BookDetailModal.jsx** - Full book details view with edit/delete actions
- **BookFormModal.jsx** - Unified add/edit book form with Google Books API auto-fill via ISBN
- **BarcodeScannerModal.jsx** - Uses zxing-wasm for ISBN barcode scanning, then fetches from Google Books API
- **HamburgerMenu.jsx** - Navigation menu with import/export, sign out, admin access
- **SignInPrompt.jsx** - Landing page for unauthenticated users
- **AdminPanel.jsx** - Admin-only panel to view all users and their books
- **BookVisionTestModal.jsx** - Test tool for book cover recognition

### Hooks
- **useAuth.js** - Firebase Auth state, signIn/signOut methods
- **useBooks.js** - Firestore subscription, CRUD operations for books
- **useAdmin.js** - Admin functions to fetch all users and their books

### External APIs
- **Google Books API** (`https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`) - ISBN lookup in BookFormModal and BarcodeScannerModal
- **Firebase Cloud Functions** - Book cover recognition via Gemini vision

### Key Libraries
- **zxing-wasm** - Barcode scanning via device camera
- **Fuse.js** - Client-side fuzzy search
- **firebase** - Auth, Firestore, Storage, Functions
- **src/utils/uuid.js** - Custom UUID v4 generation (no npm package)

### Firebase Configuration
- Config loaded from env vars (VITE_FIREBASE_*)
- Emulator support via VITE_USE_EMULATOR=true
- Emulator ports: Firestore 8080, Auth 9099, Functions 5001, Storage 9199

### Testing
- Playwright for e2e tests in `tests/` directory
- Tests run against Chromium only
- Dev server auto-started by Playwright config

### ISBN Scanning Test Mode
- Test mode enabled via `?testMode=true` URL param (dev only)
- Barcode images stored in `public/test-barcodes/{isbn}.png`
- Test helper in `src/utils/testModeHelpers.js`
- Tests in `tests/barcode-scanner.spec.js` use mocked Google Books API
- To add new test ISBN: generate EAN-13 barcode PNG, save to test-barcodes dir
- Test code is tree-shaken from production builds via `import.meta.env.DEV` guards

### Admin Access
- Admin emails configured in `src/config/adminConfig.js`
- Emulator mode grants admin access automatically
