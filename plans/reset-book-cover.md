# Reset Book Cover Feature

## Overview
Add a "Reset Image" button to the edit book form that fetches the latest cover image from Google Books API.

## Requirements
1. **Primary**: Search by ISBN if available
2. **Fallback**: Search by title + author if no ISBN exists
3. Only update the cover URL (not other book data)
4. Only show button when sufficient information exists
5. No confirmation needed - immediate action
6. Replace existing cover without deleting from storage

## Implementation Plan

### 1. Add new API function to `googleBooksApi.js`
- Create `fetchBookCoverByTitleAuthor(title, author)` function
- Use query format: `intitle:{title}+inauthor:{author}`
- Return only the cover URL from first result

### 2. Update BookFormModal.jsx
- Add "Reset Image" button in cover actions section
- Button visibility: `isEditMode && (formData.isbn || (formData.title && formData.author))`
- Add `isResettingCover` state for loading management
- Create `resetCoverFromISBN()` function with ISBN + title/author fallback logic
- Handle loading states and error messaging

### 3. Button Logic
```javascript
// When ISBN exists: use ISBN search (most accurate)
// When no ISBN but title+author exist: use title+author search
// Only show button when either condition is met
```

### 4. Error Handling
- No results found: "No cover image found" alert
- Network/API errors: "Failed to fetch cover image" alert
- Disable buttons during reset operation
- Reuse existing loading states and patterns

## Files to Modify
1. `src/utils/googleBooksApi.js` - Add title/author search function
2. `src/components/BookFormModal.jsx` - Add button and reset logic

## Testing Scenarios
1. Edit book with ISBN → should fetch by ISBN
2. Edit book without ISBN but with title+author → should fetch by title/author
3. Edit book missing all data → button should not show
4. Search returns no results → should show appropriate error
5. Search returns results but no cover → should clear existing cover