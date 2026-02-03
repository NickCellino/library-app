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

**IMPORTANT for manual testing with Playwright MCP**: Always use `npm run dev:emulate` instead of `npm run dev`. Emulator mode auto-signs in anonymously, avoiding Google OAuth popups. Regular dev mode requires real Google authentication which blocks Playwright testing.

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
- **E2E Tests**: Playwright in `tests/` directory (Chromium only, dev server auto-started)
- **Unit Tests**: Vitest in `src/` directory
  - Run: `npm run test:unit`
  - Run with UI: `npm run test:unit:ui`
  - Tests utility functions and business logic in isolation
- **Cloud Functions Tests**: Mocha in `functions/test/` directory
  - Run: `cd functions && npm test`
  - Tests `recognizeCover` function locally (not deployed)
  - Requires: `gcloud auth application-default login` for Vision API
  - Uses real Vision API + Google Books API
  - API key auto-loaded from `functions/.secret.local`
  - Run benchmark only: `cd functions && npm test -- --grep "BENCHMARK"`

### Iterating on Book Cover Recognition

The `recognizeCover` function uses OCR + Google Books search. A benchmark test scores ranking quality.

**Benchmark scoring**: position 0 = 100, position 1 = 90, ..., not found = 0

**Iteration workflow**:
1. Run benchmark: `cd functions && npm test -- --grep "BENCHMARK"`
2. Note current average score and which books need improvement
3. Debug specific failures with inline node script:
   ```bash
   node -e "
   import { readFileSync } from 'fs';
   import { extractTextFromImage } from './src/visionClient.js';
   import { parseOcrText, generateSearchQueries } from './src/textParser.js';
   const img = readFileSync('./test/fixtures/FILENAME.jpeg');
   const rawText = await extractTextFromImage(img.toString('base64'));
   const candidates = parseOcrText(rawText);
   console.log('Raw:', rawText);
   console.log('Titles:', candidates.titleCandidates);
   console.log('Authors:', candidates.authorCandidates);
   console.log('Queries:', generateSearchQueries(candidates));
   "
   ```
4. Modify relevant file based on issue:
   - **textParser.js**: OCR text parsing, title/author detection, query generation
   - **bookSearch.js**: Google Books search, result scoring/ranking
   - **commonFirstNames.js**: First name list for author detection
5. Re-run benchmark to measure improvement
6. Repeat until satisfied

**Adding test fixtures**: Photos must be actual JPEG (not HEIF with .jpeg extension). Convert with: `sips -s format jpeg input.heic --out output.jpeg`

**Common issues**:
- Title split across lines → improve ALL CAPS word joining in textParser
- Author misdetected as title → add name to commonFirstNames.js or improve looksLikeName()
- Wrong book ranked first → adjust scoring weights in bookSearch.js scoreResult()

### Barcode Scanner Testing
- Tests use Chrome's fake camera via MJPEG video file
- Video fixture: `tests/fixtures/barcode-scan-test.mjpeg` (Ulysses then Creative Act barcodes)
- Playwright config sets `--use-fake-device-for-media-stream` Chrome flags
- Tests must run sequentially (workers: 1) since Chrome only supports one fake video globally
- To update video fixtures:
  1. Record MOV files of book barcodes
  2. Combine with ffmpeg: `ffmpeg -i book1.MOV -i book2.MOV -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,fps=15,scale=640:480" -q:v 5 barcode-scan-test.mjpeg`
  3. Update mock ISBNs in test files to match

### Admin Access
- Admin emails configured in `src/config/adminConfig.js`
- Emulator mode grants admin access automatically
