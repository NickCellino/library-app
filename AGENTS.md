# AGENTS.md

Agent-facing reference for working in this repository.

Be extremely concise in interactions and commit messages.

## Project Summary

Library is a React + Vite personal book collection manager with Firebase backend services.

- Mobile-first UI with an editorial/art deco aesthetic
- Firebase Auth for sign-in
- Firestore for per-user book storage
- Storage for cover images
- Callable Functions for Google Books lookups and cover recognition
- Vercel for frontend hosting
- Terraform for Firebase and Google Cloud infrastructure

## Core Commands

Start long-running processes with `pty_*` tools.

```bash
npm run dev          # Vite dev server (requires real Google auth)
npm run dev:emulate  # Vite + Firebase emulator mode
npm run emulators    # Firebase emulators only
npm run emulators:kill
npm run build
npm run preview
npm test
npm run test:ui
npm run test:debug
npm run test:unit
npm run test:unit:ui
npm run tf:init
npm run tf:plan
npm run tf:apply
npm run tf:output
```

## Preferred Development Workflow

Use `npm run dev:emulate` for manual testing and browser automation. Emulator mode auto-signs in anonymously and avoids Google OAuth popups.

When changing UI behavior:

1. Start `npm run dev:emulate`.
2. Verify the change in-browser.
3. Use the Playwright UI tester subagent when end-to-end validation is useful.

Tests require the dev server running. Playwright config will auto-start it when needed.

When test data is needed, use hamburger menu -> `dev tools` -> `load test data`.

## Architecture

### Main Data Flow

- `useAuth` manages Firebase Auth state and sign-in/sign-out
- `useBooks` manages the Firestore subscription and book CRUD
- `App.jsx` orchestrates app-level UI state
- Books live at `users/{uid}/books/{bookId}`
- Fuzzy search runs client-side across title, author, ISBN, and publisher

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

### Key Components

- `App.jsx` - main orchestrator
- `BookList.jsx` - groups books by author
- `BookCard.jsx` - compact book display
- `BookDetailModal.jsx` - full detail view with actions
- `BookFormModal.jsx` - add/edit form with ISBN lookup
- `BarcodeScannerModal.jsx` - ISBN scanning via `zxing-wasm`
- `HamburgerMenu.jsx` - navigation and dev tools access
- `SignInPrompt.jsx` - unauthenticated landing screen
- `AdminPanel.jsx` - admin-only user and book view
- `BookVisionTestModal.jsx` - cover recognition test tool

### Hooks

- `useAuth.js`
- `useBooks.js`
- `useAdmin.js`

### Key Libraries

- `firebase`
- `fuse.js`
- `zxing-wasm`
- `src/utils/uuid.js`

## Environment Setup

### Frontend Env Vars

Frontend config is loaded from `VITE_FIREBASE_*` variables.

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

These are required in Vercel project settings for production builds.

### Emulator Configuration

- Set by `VITE_USE_EMULATOR=true`
- Firestore: `8080`
- Auth: `9099`
- Functions: `5001`
- Storage: `9199`
- Emulator UI: `http://localhost:4000`

### Keys And Secrets

- `VITE_FIREBASE_API_KEY` is only for Firebase web app initialization
- The frontend does not call Google Books directly
- `GOOGLE_BOOKS_API_KEY` is a server-side Functions secret
- Functions load it with `defineSecret('GOOGLE_BOOKS_API_KEY')`
- Set it with `firebase functions:secrets:set GOOGLE_BOOKS_API_KEY`
- Underlying cloud resources are managed in `terraform/main.tf`

## Testing Notes

### E2E

- Playwright tests live in `tests/`
- Chromium only
- The test command kills old emulators first

### Unit

- Vitest tests live alongside app code in `src/`
- Use for utility and business-logic coverage

### Cloud Functions

- Run from `functions/` with `npm test`
- `recognizeCover` tests use real Vision API and Google Books API
- Requires `gcloud auth application-default login`
- Loads secrets from `functions/.secret.local`
- Benchmark only: `npm test -- --grep "BENCHMARK"`

## Book Cover Recognition Workflow

The `recognizeCover` function uses OCR plus Google Books search. Benchmark scoring is `100` for rank `0`, `90` for rank `1`, decreasing by `10`, and `0` when not found.

Iteration workflow:

1. Run `cd functions && npm test -- --grep "BENCHMARK"`.
2. Note failing books and average score.
3. Debug a fixture with:

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

4. Adjust the relevant file:
- `textParser.js` for OCR parsing and query generation
- `bookSearch.js` for ranking and scoring
- `commonFirstNames.js` for author detection support
5. Re-run the benchmark.

Common issues:

- Title split across lines: improve ALL CAPS joining in `textParser`
- Author treated as title: add a first name or improve `looksLikeName()`
- Wrong book ranked first: adjust `scoreResult()` in `bookSearch.js`

Fixture note: image fixtures must be real JPEGs, not HEIF files with a `.jpeg` extension. Convert with `sips -s format jpeg input.heic --out output.jpeg`.

## Barcode Scanner Testing

- Uses Chrome fake camera support with an MJPEG file
- Fixture: `tests/fixtures/barcode-scan-test.mjpeg`
- Current sequence: Ulysses then Creative Act barcodes
- Playwright sets `--use-fake-device-for-media-stream`
- Tests must run with a single worker because Chrome only supports one fake video globally

To update the fixture:

1. Record source `.MOV` clips.
2. Combine them with:

```bash
ffmpeg -i book1.MOV -i book2.MOV -filter_complex "[0:v][1:v]concat=n=2:v=1:a=0,fps=15,scale=640:480" -q:v 5 barcode-scan-test.mjpeg
```

3. Update mocked ISBNs in the tests.

## Admin Access

- Admin emails are configured in `src/config/adminConfig.js`
- Emulator mode grants admin access automatically

## Terraform Notes

Use `terraform/README.md` for infrastructure-specific setup and import steps.
