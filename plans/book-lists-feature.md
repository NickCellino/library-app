# Book Lists Feature - Implementation Plan

## Overview

Add a "book lists" feature allowing users to create named collections of books from their library. Users can add books via search or barcode scanning, view list contents, and manage list membership.

## User Requirements

- Create named lists (e.g., "Fall 2026 reading list")
- Add books to lists via:
  - Search existing library
  - Barcode scan (add to library if not present, then add to list)
- View list contents
- Remove books from lists
- Delete lists
- View which lists a book belongs to (in book detail modal)
- Access lists from hamburger menu

## Design Decisions

- **List access**: Hamburger menu ("My Lists" option)
- **Book ordering**: Unordered collections (no user reordering)
- **Book deletion**: Auto-remove from all lists when book deleted
- **List membership**: Show badges in BookDetailModal
- **List names**: Unique per user, max 128 chars
- **Empty lists**: Allowed
- **Duplicate scan handling**: Show toast "Already in list"
- **List sorting**: By updatedAt (most recent first)
- **Book display**: Same as library (BookList component, grouped by author)

---

## Data Model

### Firestore Collection

**Path:** `users/{uid}/lists/{listId}`

**Schema:**
```javascript
{
  id: string,              // UUID v4
  name: string,            // Max 128 chars, unique per user
  bookIds: string[],       // Array of book IDs (order preserved but not meaningful)
  createdAt: string,       // ISO timestamp
  updatedAt: string        // ISO timestamp (updated on any change)
}
```

**Indexes needed:**
- None (queries by user ID only)

---

## New Hook: `src/hooks/useLists.js`

### Exports

```javascript
const {
  lists,                    // Array of list objects, sorted by updatedAt desc
  loading,                  // Boolean
  addList,                  // (name) => Promise<void>
  updateList,               // (list) => Promise<void>
  deleteList,               // (listId) => Promise<void>
  addBookToList,            // (listId, bookId) => Promise<void>
  removeBookFromList,       // (listId, bookId) => Promise<void>
  getListsForBook,          // (bookId) => string[] (list names)
  removeBookFromAllLists    // (bookId) => Promise<void>
} = useLists(user)
```

### Implementation Details

**Real-time subscription:**
```javascript
useEffect(() => {
  if (!user) return;
  
  const q = query(
    collection(db, 'users', user.uid, 'lists'),
    orderBy('updatedAt', 'desc')
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const listsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setLists(listsData);
    setLoading(false);
  });
  
  return unsubscribe;
}, [user]);
```

**Validation:**
- Name max 128 chars: `name.slice(0, 128)`
- Unique name: Check `lists.some(l => l.name === name)` before creating
- Show error toast if duplicate

**Key methods:**

```javascript
const addList = async (name) => {
  // Validate uniqueness
  if (lists.some(l => l.name === name)) {
    throw new Error('List name already exists');
  }
  
  // Truncate to 128 chars
  const truncatedName = name.slice(0, 128);
  
  const listId = uuidv4();
  const listData = {
    id: listId,
    name: truncatedName,
    bookIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(doc(db, 'users', user.uid, 'lists', listId), listData);
};

const addBookToList = async (listId, bookId) => {
  const list = lists.find(l => l.id === listId);
  if (!list) return;
  
  // Avoid duplicates
  if (list.bookIds.includes(bookId)) return;
  
  const updatedList = {
    ...list,
    bookIds: [...list.bookIds, bookId],
    updatedAt: new Date().toISOString()
  };
  
  await setDoc(doc(db, 'users', user.uid, 'lists', listId), updatedList);
};

const removeBookFromAllLists = async (bookId) => {
  const batch = writeBatch(db);
  
  lists.forEach(list => {
    if (list.bookIds.includes(bookId)) {
      const updatedList = {
        ...list,
        bookIds: list.bookIds.filter(id => id !== bookId),
        updatedAt: new Date().toISOString()
      };
      batch.set(doc(db, 'users', user.uid, 'lists', list.id), updatedList);
    }
  });
  
  await batch.commit();
};

const getListsForBook = (bookId) => {
  return lists
    .filter(list => list.bookIds.includes(bookId))
    .map(list => list.name);
};
```

---

## New Components

### 1. `src/components/ListsViewModal.jsx`

**Purpose:** Main lists view, entry point from hamburger menu

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  lists: array,
  onSelectList: (list) => void,      // Opens ListDetailModal
  onCreateList: (name) => Promise<void>,
  onDeleteList: (listId) => Promise<void>,
  loading: boolean
}
```

**Layout:**
```
┌─────────────────────────────┐
│ My Lists            [+] [X] │  <- Header
├─────────────────────────────┤
│ Fall 2026 reading    5 books│  <- List item (clickable)
│ Updated 2 days ago          │
│                          🗑️ │  <- Delete button
├─────────────────────────────┤
│ To Read              12 books│
│ Updated 1 week ago          │
│                          🗑️ │
└─────────────────────────────┘

Empty state:
┌─────────────────────────────┐
│                             │
│         [📚 icon]           │
│      No lists yet           │
│   Create your first list    │
│       [Create List]         │
│                             │
└─────────────────────────────┘
```

**Features:**
- Create list button (inline form or modal)
- List items show: name, book count, "Updated X ago"
- Click list → calls `onSelectList(list)`
- Delete icon → shows confirmation modal
- Empty state with create button
- Loading state

**Styling:**
- Follow existing modal patterns (`.modal-overlay`, `.modal-content`)
- Use theme variables (`--color-accent`, `--glass-bg`)
- List items: card-style with hover effects

---

### 2. `src/components/ListDetailModal.jsx`

**Purpose:** View and manage individual list

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  list: object | null,
  books: array,                      // All books from useBooks
  onAddBooks: () => void,            // Opens AddToListModal
  onRemoveBook: (bookId) => Promise<void>,
  onUpdateListName: (name) => Promise<void>,
  onDeleteList: () => void
}
```

**Layout:**
```
┌─────────────────────────────┐
│ Fall 2026 reading    [X]    │  <- Editable name
├─────────────────────────────┤
│ [Add Books]                 │  <- Action button
├─────────────────────────────┤
│ Author: Murakami, Haruki    │
│ ┌────┐                      │
│ │    │ Norwegian Wood       │  <- BookCard
│ └────┘ 1987 · Vintage [X]   │
│                             │
│ Author: Orwell, George      │
│ ┌────┐                      │
│ │    │ 1984                 │
│ └────┘ 1949 · Secker [X]    │
└─────────────────────────────┘

Empty state:
┌─────────────────────────────┐
│ [Add Books]                 │
│                             │
│         [📚 icon]           │
│   No books in this list     │
│   Add books to get started  │
│                             │
└─────────────────────────────┘
```

**Features:**
- Editable list name (click to edit inline)
- "Add Books" button → opens AddToListModal
- Books displayed using `BookList` component (reuse existing)
- Each book has remove button (X icon, top-right of card)
- Empty state with add button
- Footer: "Delete List" button (muted, danger style)

**Implementation:**
```javascript
// Get books in this list
const listBooks = useMemo(() => {
  if (!list) return [];
  return books.filter(book => list.bookIds.includes(book.id));
}, [list, books]);

// Group by author (reuse logic from App.jsx)
// Render using <BookList books={listBooks} onBookClick={...} />
```

---

### 3. `src/components/AddToListModal.jsx`

**Purpose:** Add books to list via search or barcode scan

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  list: object,
  books: array,                      // All books
  onAddBook: (bookId) => Promise<void>,
  onAddNewBook: (book) => Promise<void>  // Add to library + list
}
```

**Layout:**
```
┌─────────────────────────────┐
│ Add to "Fall 2026"     [X]  │
├─────────────────────────────┤
│ [Search]  [Scan]            │  <- Tab bar
├─────────────────────────────┤
│ SEARCH TAB:                 │
│ [🔍 Search your library...] │
│                             │
│ ┌────┐                      │
│ │    │ The Great Gatsby  ✓  │  <- Already in list
│ └────┘                      │
│ ┌────┐                      │
│ │    │ Dune                 │  <- Click to add
│ └────┘                      │
│                             │
├─────────────────────────────┤
│ SCAN TAB:                   │
│ [Camera view]               │
│                             │
│ Scanned: ISBN 1234567890    │
│ Status: Added to list ✓     │
│                             │
│ Added: 3 books              │  <- Session counter
└─────────────────────────────┘
```

**Features:**

**Search Tab:**
- Search input (reuse Fuse.js from App.jsx)
- Results show BookCard components
- Already-in-list books show checkmark badge
- Click book → calls `onAddBook(book.id)`
- Real-time search as user types

**Scan Tab:**
- Reuse BarcodeScannerModal camera logic
- Different flow than regular scanner:
  1. Scan ISBN
  2. Check if book exists in `books` array
  3. If exists + already in list → toast "Already in list"
  4. If exists + not in list → call `onAddBook(book.id)`, toast "Added to list"
  5. If not exists → fetch from Google Books API, call `onAddNewBook(newBook)`, toast "Added to library and list"
- Session counter shows books added
- Same toast styling as regular scanner

**Implementation Notes:**
- Extract camera/scanning logic from BarcodeScannerModal into reusable hook or component
- Use conditional rendering for tabs
- Track added books in local state to show checkmarks

---

### 4. `src/components/DeleteListConfirmModal.jsx`

**Purpose:** Confirm list deletion with context

**Props:**
```javascript
{
  isOpen: boolean,
  onClose: () => void,
  onConfirm: () => void,
  list: object,
  books: array
}
```

**Layout:**
```
┌─────────────────────────────┐
│ Delete List?                │
├─────────────────────────────┤
│ Are you sure you want to    │
│ delete "Fall 2026 reading"? │
│                             │
│ This list contains:         │
│ • Norwegian Wood            │
│ • 1984                      │
│ • The Great Gatsby          │
│                             │
│ [Cancel]  [Delete]          │
└─────────────────────────────┘
```

**Features:**
- Show list name
- Show list of book titles (if any)
- "Cancel" / "Delete" buttons
- Danger styling on delete button

---

## Modified Components

### 1. `src/components/HamburgerMenu.jsx`

**Changes:**
- Add "My Lists" menu item before "Sign Out"
- Add `onShowLists` prop

**Implementation:**
```javascript
// Add to menu items array (around line 100)
<div className="hamburger-item" onClick={onShowLists}>
  <span className="hamburger-icon">📚</span>
  <span>My Lists</span>
</div>
<div className="hamburger-divider"></div>
```

---

### 2. `src/components/BookDetailModal.jsx`

**Changes:**
- Show list membership badges
- Add `lists` prop or fetch via `getListsForBook(book.id)`

**Layout:**
```
┌─────────────────────────────┐
│ [Cover]  Norwegian Wood     │
│          Murakami, Haruki   │
│                             │
│ In: Fall 2026 · To Read     │  <- Badges
│                             │
│ ISBN: 978-0-375-...         │
│ Published: 1987             │
│ ...                         │
└─────────────────────────────┘
```

**Implementation:**
```javascript
// Get lists containing this book
const containingLists = lists.filter(list => 
  list.bookIds.includes(book.id)
);

// Render badges
{containingLists.length > 0 && (
  <div className="list-badges">
    <span className="badge-label">In:</span>
    {containingLists.map(list => (
      <span 
        key={list.id} 
        className="list-badge"
        onClick={() => onOpenList(list)}
      >
        {list.name}
      </span>
    ))}
  </div>
)}
```

**Styling:**
```css
.list-badges {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.list-badge {
  background: var(--color-accent);
  color: var(--color-bg);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.list-badge:hover {
  transform: translateY(-1px);
}
```

---

### 3. `src/hooks/useBooks.js`

**Changes:**
- Modify `deleteBook` to also remove book from all lists

**Implementation:**
```javascript
// Add at top of file
import { removeBookFromAllLists } from './useLists';

// Modify deleteBook function (around line 57)
const deleteBook = async (bookId) => {
  if (!user) return;
  
  // Remove from all lists first
  await removeBookFromAllLists(bookId);
  
  // Then delete the book
  await deleteDoc(doc(db, 'users', user.uid, 'books', bookId));
};
```

**Alternative approach (if circular dependency):**
- Pass `onBookDeleted` callback from App.jsx
- App.jsx calls both `deleteBook` and `removeBookFromAllLists`

---

### 4. `src/App.jsx`

**Changes:**
- Import and use `useLists` hook
- Add state for list-related modals
- Render new modal components

**New State:**
```javascript
const [showListsModal, setShowListsModal] = useState(false);
const [selectedList, setSelectedList] = useState(null);
const [showListDetail, setShowListDetail] = useState(false);
const [showAddToList, setShowAddToList] = useState(false);
const [listToDelete, setListToDelete] = useState(null);
```

**New Handlers:**
```javascript
const handleCreateList = async (name) => {
  try {
    await addList(name);
    // Success toast
  } catch (error) {
    // Error toast (e.g., duplicate name)
  }
};

const handleSelectList = (list) => {
  setSelectedList(list);
  setShowListsModal(false);
  setShowListDetail(true);
};

const handleDeleteList = async (listId) => {
  await deleteList(listId);
  setShowListDetail(false);
  setSelectedList(null);
  setListToDelete(null);
};
```

**Modal Rendering (add after existing modals):**
```javascript
{showListsModal && (
  <ListsViewModal
    isOpen={showListsModal}
    onClose={() => setShowListsModal(false)}
    lists={lists}
    onSelectList={handleSelectList}
    onCreateList={handleCreateList}
    onDeleteList={(list) => setListToDelete(list)}
    loading={listsLoading}
  />
)}

{showListDetail && selectedList && (
  <ListDetailModal
    isOpen={showListDetail}
    onClose={() => {
      setShowListDetail(false);
      setSelectedList(null);
    }}
    list={selectedList}
    books={books}
    onAddBooks={() => setShowAddToList(true)}
    onRemoveBook={removeBookFromList}
    onUpdateListName={updateList}
    onDeleteList={() => setListToDelete(selectedList)}
  />
)}

{showAddToList && selectedList && (
  <AddToListModal
    isOpen={showAddToList}
    onClose={() => setShowAddToList(false)}
    list={selectedList}
    books={books}
    onAddBook={(bookId) => addBookToList(selectedList.id, bookId)}
    onAddNewBook={async (book) => {
      await addBook(book);
      await addBookToList(selectedList.id, book.id);
    }}
  />
)}

{listToDelete && (
  <DeleteListConfirmModal
    isOpen={!!listToDelete}
    onClose={() => setListToDelete(null)}
    onConfirm={() => handleDeleteList(listToDelete.id)}
    list={listToDelete}
    books={books}
  />
)}
```

**Pass to HamburgerMenu:**
```javascript
<HamburgerMenu
  // ... existing props
  onShowLists={() => setShowListsModal(true)}
/>
```

**Pass to BookDetailModal:**
```javascript
<BookDetailModal
  // ... existing props
  lists={lists}
  onOpenList={(list) => {
    setSelectedBook(null);
    setSelectedList(list);
    setShowListDetail(true);
  }}
/>
```

---

## Component Reuse Strategy

### Reuse Existing Components

1. **BookList** → Display books in ListDetailModal
   - Pass filtered `listBooks` array
   - Same grouping by author
   - Add remove button to each card

2. **BookCard** → Individual book display in lists
   - Add optional `showRemove` prop
   - Add `onRemove` callback

3. **Toast system** → All notifications
   - Use existing `showToast` function
   - Same styling, different messages

4. **Modal patterns** → All new modals
   - `.modal-overlay`, `.modal-content`
   - Backdrop click to close
   - Close button in header

### New Reusable Patterns

1. **Tab bar component** (for AddToListModal)
   ```javascript
   <TabBar tabs={['Search', 'Scan']} active={activeTab} onChange={setActiveTab} />
   ```

2. **Inline edit component** (for list name editing)
   ```javascript
   <InlineEdit value={name} onSave={handleSave} maxLength={128} />
   ```

3. **Badge component** (for list membership)
   ```javascript
   <Badge text={listName} onClick={() => onOpenList(list)} />
   ```

---

## Implementation Order

### Phase 1: Foundation
1. **Create `src/hooks/useLists.js`**
   - Implement all CRUD operations
   - Add real-time subscription
   - Test with console.log

2. **Create `src/components/ListsViewModal.jsx`**
   - Basic modal structure
   - Display lists
   - Create list functionality
   - Delete confirmation

### Phase 2: List Management
3. **Create `src/components/ListDetailModal.jsx`**
   - Display list name (editable)
   - Show books using BookList
   - Remove book functionality
   - Empty state

### Phase 3: Add Books
4. **Create `src/components/AddToListModal.jsx` (Search tab)**
   - Tab bar UI
   - Search input
   - Book results with add functionality
   - Already-in-list badges

5. **Extend AddToListModal (Scan tab)**
   - Extract scanning logic from BarcodeScannerModal
   - Implement list-context scanning flow
   - Handle new book addition
   - Session counter

### Phase 4: Integration
6. **Modify `src/components/BookDetailModal.jsx`**
   - Add list membership badges
   - Click badge to open list

7. **Modify `src/hooks/useBooks.js`**
   - Integrate `removeBookFromAllLists` into `deleteBook`

8. **Modify `src/App.jsx`**
   - Add useLists hook
   - Add modal state and rendering
   - Wire up all handlers

9. **Modify `src/components/HamburgerMenu.jsx`**
   - Add "My Lists" menu item

### Phase 5: Polish
10. **Create `src/components/DeleteListConfirmModal.jsx`**
    - Confirmation with book list
    - Wire into ListsViewModal and ListDetailModal

11. **Testing & Refinement**
    - Test all flows end-to-end
    - Edge case handling
    - Performance optimization
    - Accessibility improvements

---

## Edge Cases & Error Handling

### List Names
- **Duplicate name:** Show error toast "List name already exists"
- **Too long:** Auto-truncate to 128 chars before saving
- **Empty name:** Prevent submission, show validation error

### Book Operations
- **Book deleted from library:** Auto-remove from all lists via `removeBookFromAllLists`
- **Book already in list (search):** Show "Already in list" badge, prevent duplicate
- **Book already in list (scan):** Show toast "Already in list", continue scanning
- **Book not in library (scan):** Add to library first, then add to list

### List Operations
- **Delete non-empty list:** Show confirmation with book list
- **Delete empty list:** Simple confirmation
- **Edit list name to duplicate:** Show error, revert to original

### UI States
- **Empty lists view:** Show "No lists yet" with create button
- **Empty list detail:** Show "No books in this list" with add button
- **Loading states:** Show loading indicator while fetching
- **Offline support:** Firestore handles automatically via persistentLocalCache

---

## Testing Checklist

### Manual Testing

**List CRUD:**
- [ ] Create list with valid name
- [ ] Create list with duplicate name (show error)
- [ ] Create list with name > 128 chars (auto-truncate)
- [ ] Edit list name
- [ ] Delete empty list
- [ ] Delete list with books (show confirmation)

**Add Books via Search:**
- [ ] Search finds books
- [ ] Click to add book to list
- [ ] Already-added books show badge
- [ ] Empty search results
- [ ] Add multiple books

**Add Books via Scan:**
- [ ] Scan book already in library + in list (show "Already in list")
- [ ] Scan book in library + not in list (add to list)
- [ ] Scan book not in library (add to library + list)
- [ ] Session counter increments
- [ ] Camera permissions denied
- [ ] ISBN not found in Google Books

**Remove Books:**
- [ ] Remove book from list
- [ ] Book remains in library
- [ ] List updates immediately

**Book Deletion:**
- [ ] Delete book from library
- [ ] Book removed from all lists
- [ ] List detail view updates

**List Membership:**
- [ ] Book in 0 lists: no badges shown
- [ ] Book in 1 list: badge shown
- [ ] Book in multiple lists: all badges shown
- [ ] Click badge → opens list detail

**Navigation:**
- [ ] Hamburger menu → My Lists → lists view
- [ ] Lists view → list detail → back to lists
- [ ] Book detail → click badge → list detail
- [ ] Add to list modal → close → back to list detail

---

## Summary

This plan adds a complete book lists feature with:
- **4 new components:** ListsViewModal, ListDetailModal, AddToListModal, DeleteListConfirmModal
- **1 new hook:** useLists with CRUD operations
- **4 modified components:** HamburgerMenu, BookDetailModal, useBooks, App
- **Full barcode scanning integration:** Add books via scan with smart library checking
- **Seamless UX:** List badges, inline editing, empty states, confirmations

The feature integrates cleanly with existing patterns and reuses components extensively to maintain consistency and reduce code duplication.
