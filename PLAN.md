# Library App - Project Plan

## Overview
A personal book tracking application for managing your book collection. Accessible from anywhere with a beautiful, distinctive editorial design inspired by classic literature and art deco aesthetics.

## Technical Architecture

### Tech Stack (Decided)
- **Frontend**: React + Vite
- **Data Storage**: Browser localStorage
- **Hosting**: Vercel
- **Design Aesthetic**: Editorial/art deco with vintage library catalog influences

### Architecture Decisions
- **Data Storage Choice**: localStorage was chosen for simplicity - no backend setup, private, and sufficient for personal use
- **Hosting Choice**: Vercel for accessibility from anywhere (phone, work computer, etc.) with simple deployment via GitHub integration

## Core Features (Confirmed)

### 1. Add Books to Collection
- **Manual entry**: Form to add title, author, ISBN, etc.
- **Barcode scanning**: Use mobile camera to scan ISBN barcode
  - Should work seamlessly on mobile web (primary use case)
  - Fetch book data automatically from ISBN (Google Books API or Open Library)
- **Duplicate detection**: Validate and prevent adding books already in collection

### 2. View Book Collection
- Display list of all books with cover artwork
- Show important details for each book (title, author, cover)
- Mobile-first responsive design (primary user is on mobile)

### 3. Group Books by Author
- Books visually grouped by author in the list view
- Clear visual separation between author groups

### 4. Search Collection
- Fuzzy search across book collection
- Search should work with partial/inexact matches
- Filter results in real-time as user types
- Search across title, author, and other relevant fields

## Additional Features (Confirmed)

### Essential Additions
- **Edit books**: Modify book details after adding
- **Delete books**: Remove books from collection
- **Sort options**: By author name (A-Z), title, date added
- **Quick stats**: Display total books and unique authors count
- **Empty states**: Helpful messages when collection is empty or search has no results

### Mobile Optimizations
- **PWA capabilities**: Install as app on mobile, offline support
- **Touch-friendly UI**: Large tap targets, swipe gestures
- **Fast scanning**: Optimized barcode detection for quick multi-book entry

### Data Management
- **Export/backup**: Download collection as JSON for safekeeping
- **Import**: Restore from backup

### Book Information Fields
- Title (required)
- Author (required)
- ISBN (optional but used for scanning)
- Cover image URL (fetched from API or custom)
- Publication year (nice to have)
- Publisher (optional)
- Page count (optional)
- Date added (auto-generated)

## Technical Considerations

### Barcode Scanning
- Use **html5-qrcode** library for camera access and barcode detection
- Works on mobile browsers without app installation
- Fallback to manual ISBN entry if camera unavailable

### Book Data API
- **Google Books API** (free, no API key for basic usage, comprehensive data)
- Fallback to manual entry if API fails or book not found

### Fuzzy Search
- **Fuse.js** - lightweight fuzzy search library
- Search across multiple fields with configurable threshold

### localStorage Structure
```json
{
  "books": [
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
  ]
}
```

## Implementation Plan

### Dependencies
- **React + Vite** - Core framework
- **html5-qrcode** - Barcode scanning
- **Fuse.js** - Fuzzy search
- **Google Books API** - Book data lookup

### Component Structure
- **App.js** - Main app container, state management
- **BookList.js** - Display books grouped by author
- **AddBookForm.js** - Manual book entry form
- **BarcodeScanner.js** - Camera barcode scanning
- **SearchBar.js** - Search input with fuzzy matching
- **BookCard.js** - Individual book display component
- **Stats.js** - Collection statistics
- **ExportImport.js** - Data backup/restore

### Implementation Status

#### Completed ✅
- [x] Finalize feature requirements
- [x] Create detailed technical architecture plan
- [x] Initialize React + Vite project
- [x] Install dependencies (html5-qrcode, fuse.js, uuid)
- [x] Build core components (App, BookList, BookCard, AddBookModal, EditBookModal, BarcodeScannerModal)
- [x] Implement localStorage persistence
- [x] Add PWA manifest for mobile installation
- [x] Set up GitHub repository
- [x] Deploy to Vercel
- [x] Manual book entry with Google Books API auto-fill
- [x] Barcode scanning via html5-qrcode
- [x] View book collection with cover artwork
- [x] Group books by author (alphabetically sorted)
- [x] Fuzzy search with Fuse.js
- [x] Edit and delete books
- [x] Quick stats in header (book count, author count)
- [x] Empty states (empty collection and no search results)
- [x] Export/Import library as JSON

#### TODO ❌
- [ ] Duplicate detection (no ISBN check before adding)
- [ ] Sort options UI toggle (by author, title, date added)
- [ ] PWA icons (icon-192.png, icon-512.png referenced in manifest but missing)
- [ ] Service worker for offline support
- [ ] UI design revisit (improve editorial/art deco aesthetic)
