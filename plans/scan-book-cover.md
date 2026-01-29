# Book Vision Integration Plan

## Overview
Integrate book cover recognition from BookVisionTestModal into production app with "Scan Cover" menu item. User captures image → sees matching books → selects to add → success toast.

## Implementation Steps

### 1. Create BookVisionModal Component
**File**: `src/components/BookVisionModal.jsx`

**Key features**:
- Camera capture using WebRTC (like test modal)
- Calls `recognizeBookCover()` API with base64 JPEG
- Shows matching books as selectable cards with "Add" button
- Duplicate checking before adding
- Toast feedback (success/duplicate/error)
- Books added counter
- Collapsible debug sections (raw text, candidates, queries) - collapsed by default
- "Try Again" and "Done" buttons

**Props**: `{ onClose, onAdd, books }`

**State**:
- `isCapturing`, `isProcessing`, `error`, `results`
- `booksAdded` counter
- `currentToast` for feedback
- `expandedSections` object to track which debug sections are open

**Flow**:
1. Mount → auto-start camera
2. User clicks "Capture" → send to API
3. Show spinner during processing
4. Display results:
   - Matching books (prominent, primary focus)
   - Collapsible debug sections below (subtle)
5. User clicks "Add" on book → duplicate check → add or show duplicate toast
6. User can capture again or click "Done"

**Reuse patterns from**:
- BookVisionTestModal: camera setup, API integration
- BarcodeScannerModal: toast system, duplicate checking, counter, footer layout

### 2. Create Styles
**File**: `src/components/BookVisionModal.css`

**Key styles**:
- Modal container (max-width 500px)
- Camera view, capture button
- Processing spinner
- Book match cards (clickable, hover effects)
- Collapsible debug sections (muted colors, smaller text, chevron icons)
- Toast overlay (bottom of content)
- Footer with counter and Done button
- Mobile responsive

Follow BarcodeScannerModal patterns for consistency.

### 3. Update App.jsx

**Add state** (line ~34):
```jsx
const [showVisionModal, setShowVisionModal] = useState(false)
```

**Import modal** (line ~6):
```jsx
import BookVisionModal from './components/BookVisionModal'
```

**Render modal** (after showScannerModal block):
```jsx
{showVisionModal && (
  <BookVisionModal
    onClose={() => setShowVisionModal(false)}
    onAdd={addBook}
    books={books}
  />
)}
```

**Add callback to HamburgerMenu** (line ~274):
```jsx
onScanCover={() => setShowVisionModal(true)}
```

### 4. Update HamburgerMenu.jsx

**Add prop** (line 3):
```jsx
function HamburgerMenu({ isOpen, onClose, onAddBook, onScanCover, ...
```

**Add menu item** (after "Add Book" button, line ~46):
```jsx
<button className="hamburger-item" onClick={() => handleAction(onScanCover)}>
  <span className="hamburger-icon">📷</span>
  Scan Cover
</button>
```

## UI/UX Details

### Results Display (Priority Order)
1. **Matching Books** (prominent):
   - Cards with cover thumbnail (60x85px), title, author, meta
   - "Add" button on each
   - Hover/active states

2. **Debug Info** (subtle, collapsible):
   - "OCR Text" section (collapsed by default)
   - "Parsed Candidates" section (collapsed)
   - "Search Queries" section (collapsed)
   - Chevron icons indicate expand/collapse
   - Muted text colors when collapsed
   - Full details when expanded

### Collapsible Sections Implementation
```jsx
const [expandedSections, setExpandedSections] = useState({
  ocrText: false,
  candidates: false,
  queries: false
})

const toggleSection = (section) => {
  setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
}
```

### Toast Types
- **Success**: Book cover + title + author + "Added ✓"
- **Duplicate**: Book info + "Already in library"
- **Error**: Error message
- Auto-dismiss after 2.5s

## Edge Cases

1. **No books found**: Show "No matches found" with "Try Again" button
2. **Duplicate book**: Show toast, don't increment counter
3. **API error**: Show error toast, keep camera available
4. **Camera denied**: Show error with instructions, provide "Done" button
5. **Network error**: Handle in useBooks hook, show error toast

## Files Modified

- `src/components/BookVisionModal.jsx` (new)
- `src/components/BookVisionModal.css` (new)
- `src/App.jsx` (add state, import, render modal, add callback)
- `src/components/HamburgerMenu.jsx` (add prop, add menu item)

## Verification Steps

1. Start dev server: `npm run dev`
2. Use Playwright MCP to test:
   - Open hamburger menu
   - Click "Scan Cover" menu item
   - Verify modal opens and camera starts
   - Grant camera permission if prompted
   - Point camera at book cover
   - Click "Capture" button
   - Verify processing spinner shows
   - Verify matching books display prominently
   - Verify debug sections are collapsed by default
   - Click to expand debug sections, verify they show details
   - Click "Add" on a book
   - Verify success toast appears
   - Verify book appears in library
   - Try adding same book again
   - Verify duplicate toast shows
   - Capture another book cover
   - Verify counter increments correctly
   - Click "Done"
   - Verify modal closes and camera stops

3. Test edge cases:
   - Poor quality image (no matches)
   - API error handling
   - Duplicate detection
   - Multiple captures in one session

## Dependencies

All existing:
- `uuid` - Generate book IDs
- `firebase/functions` - Cloud Function call
- WebRTC - Browser camera API
- `src/utils/coverRecognition.js` - recognizeBookCover function
