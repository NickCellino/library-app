# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

There is an implementation plan in PLAN.md

In all interactions and commit messages, be extremely concise and sacrific grammar for the sake of concision.

## Build and Development Commands

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run Playwright e2e tests
npm run test:ui      # Run tests with Playwright UI
npm run test:debug   # Run tests in debug mode
```

Tests require the dev server running (Playwright config auto-starts it).

## Architecture

React + Vite personal book collection manager with localStorage persistence. Mobile-first design with editorial/art deco aesthetic.

### Architecture Decisions
- **localStorage** chosen for simplicity - no backend setup, private, sufficient for personal use
- **Vercel** hosting for accessibility from anywhere (phone, work computer) with GitHub integration

### Data Flow
- **App.jsx** is the single source of truth for all state (books, modals, search)
- Books are loaded from `localStorage['library-books']` on mount and auto-saved on every change
- Fuzzy search uses Fuse.js across title, author, ISBN, and publisher fields

### localStorage Structure
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
- **App.jsx** - Main state container with all CRUD handlers and modal visibility
- **BookList.jsx** - Renders books grouped by author
- **BookCard.jsx** - Individual book display with edit/delete actions
- **AddBookModal.jsx** - Manual book entry with Google Books API auto-fill via ISBN
- **EditBookModal.jsx** - Reuses AddBookModal styling for editing
- **BarcodeScannerModal.jsx** - Uses html5-qrcode for ISBN barcode scanning, then fetches from Google Books API

### External APIs
- **Google Books API** (`https://www.googleapis.com/books/v1/volumes?q=isbn:{isbn}`) - Used for ISBN lookup in both AddBookModal and BarcodeScannerModal

### Key Libraries
- **html5-qrcode** - Barcode/QR scanning via device camera
- **Fuse.js** - Client-side fuzzy search
- **uuid** - Book ID generation

### Testing
- Playwright for e2e tests in `tests/` directory
- Tests run against Chromium only
- Dev server auto-started by Playwright config
