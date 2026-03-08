# Admin Panel Route Migration Implementation Plan

## Overview

Migrate the admin panel from a modal to a dedicated `/admin` route with enhanced list viewing capabilities.

## Design Decisions

### URL Path
- **Path**: `/admin`
- **Navigation**: Hamburger menu "Admin Panel" link navigates to `/admin`

### Access Control
- **Unauthorized access**: Redirect to home page (`/`)
- **Admin check**: Via `isAdmin()` function or emulator mode

### Navigation
- **To admin panel**: Hamburger menu link
- **Back to library**: Header back button (← Library)

### Features
- **User list**: View all users
- **User detail**: View user's books AND lists (via tabs)
- **List detail**: View books on a specific list
- **Orphaned books**: Show all books, even if some bookIds don't exist (with "Missing Book" placeholder)

### Layout
- **Header**: Same as main app with back button
- **Tabs**: Books | Lists (when viewing a user)
- **Drill-down pattern**: User → User Detail (tabs) → List Detail

## Implementation

### 1. Update useAdmin Hook

**File**: `src/hooks/useAdmin.js`

Add list fetching capabilities:

```javascript
// Add new state
const [userLists, setUserLists] = useState([])
const [selectedList, setSelectedList] = useState(null)

// Add fetchUserLists function
const fetchUserLists = useCallback(async (uid) => {
  if (!canAccess) return
  setLoading(true)
  try {
    const listsRef = collection(db, 'users', uid, 'lists')
    const q = query(listsRef, orderBy('updatedAt', 'desc'))
    const snapshot = await getDocs(listsRef)
    const lists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    setUserLists(lists)
  } catch (error) {
    console.error('Failed to fetch user lists:', error)
  } finally {
    setLoading(false)
  }
}, [canAccess])

// Add clearSelectedList function
const clearSelectedList = useCallback(() => {
  setSelectedList(null)
}, [])

// Return new values
return {
  // ...existing
  userLists,
  selectedList,
  fetchUserLists,
  clearSelectedList,
  setSelectedList
}
```

### 2. Create AdminRoute Component

**File**: `src/components/AdminRoute.jsx`

Route wrapper with access control (similar to ListDetailRoute):

```javascript
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAdmin } from '../hooks/useAdmin'
import { isAdmin } from '../config/adminConfig'
import AdminPage from './AdminPage'

const isEmulatorMode = import.meta.env.VITE_USE_EMULATOR === 'true'

function AdminRoute() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const admin = useAdmin(user)
  
  const userIsAdmin = (user?.email && isAdmin(user.email)) || isEmulatorMode

  // Fetch users on mount
  useEffect(() => {
    if (user && userIsAdmin) {
      admin.fetchUsers()
    }
  }, [user, userIsAdmin])

  // Auth loading state
  if (authLoading) {
    return (
      <div className="app">
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  // Not signed in - redirect to home
  if (!user) {
    navigate('/')
    return null
  }

  // Not admin - redirect to home
  if (!userIsAdmin) {
    navigate('/')
    return null
  }

  return (
    <AdminPage 
      admin={admin}
      onBack={() => navigate('/')}
    />
  )
}

export default AdminRoute
```

### 3. Create AdminPage Component

**File**: `src/components/AdminPage.jsx`

Main admin UI with tabs and drill-down navigation:

```javascript
import { useState, useEffect } from 'react'
import './AdminPage.css'

function AdminPage({ admin, onBack }) {
  const [activeTab, setActiveTab] = useState('books')

  // Fetch lists when switching to lists tab
  useEffect(() => {
    if (admin.selectedUser && activeTab === 'lists') {
      admin.fetchUserLists(admin.selectedUser)
    }
  }, [admin.selectedUser, activeTab])

  // Helper to get books on a list (handles missing books)
  const getBooksOnList = (list, allBooks) => {
    return list.bookIds.map(bookId => {
      const book = allBooks.find(b => b.id === bookId)
      return book || { id: bookId, title: 'Missing Book', author: 'Unknown' }
    })
  }

  const selectedUserData = admin.users.find(u => u.uid === admin.selectedUser)

  // View: List Detail
  if (admin.selectedList) {
    const list = admin.userLists.find(l => l.id === admin.selectedList)
    const booksOnList = getBooksOnList(list, admin.userBooks)
    
    return (
      <div className="admin-page">
        <header className="admin-header">
          <button className="admin-back" onClick={admin.clearSelectedList}>
            ←
          </button>
          <h1>{list?.name || 'List'}</h1>
        </header>
        
        <div className="admin-content">
          {admin.loading ? (
            <div className="admin-loading">
              <div className="loading-spinner" />
            </div>
          ) : (
            <div className="admin-books">
              {booksOnList.length === 0 ? (
                <div className="admin-empty">No books on this list</div>
              ) : (
                booksOnList.map(book => (
                  <div key={book.id} className="admin-book-item">
                    <div className="admin-book-title">{book.title}</div>
                    <div className="admin-book-author">{book.author}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // View: User Detail (with tabs)
  if (admin.selectedUser) {
    return (
      <div className="admin-page">
        <header className="admin-header">
          <button className="admin-back" onClick={admin.clearSelectedUser}>
            ←
          </button>
          <h1>{selectedUserData?.email || 'User'}</h1>
        </header>

        <div className="admin-tabs">
          <button 
            className={`admin-tab ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            Books
          </button>
          <button 
            className={`admin-tab ${activeTab === 'lists' ? 'active' : ''}`}
            onClick={() => setActiveTab('lists')}
          >
            Lists
          </button>
        </div>
        
        <div className="admin-content">
          {admin.loading ? (
            <div className="admin-loading">
              <div className="loading-spinner" />
            </div>
          ) : activeTab === 'books' ? (
            <div className="admin-books">
              {admin.userBooks.length === 0 ? (
                <div className="admin-empty">No books</div>
              ) : (
                admin.userBooks.map(book => (
                  <div key={book.id} className="admin-book-item">
                    <div className="admin-book-title">{book.title}</div>
                    <div className="admin-book-author">{book.author}</div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="admin-lists">
              {admin.userLists.length === 0 ? (
                <div className="admin-empty">No lists</div>
              ) : (
                admin.userLists.map(list => (
                  <button
                    key={list.id}
                    className="admin-list-item"
                    onClick={() => admin.setSelectedList(list.id)}
                  >
                    <div className="admin-list-name">{list.name}</div>
                    <div className="admin-list-count">{list.bookIds?.length || 0} books</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  // View: User List
  return (
    <div className="admin-page">
      <header className="admin-header">
        <button className="admin-back" onClick={onBack}>
          ← Library
        </button>
        <h1>Admin Panel</h1>
      </header>

      <div className="admin-content">
        {admin.loading ? (
          <div className="admin-loading">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="admin-users">
            {admin.users.length === 0 ? (
              <div className="admin-empty">No users</div>
            ) : (
              admin.users.map(u => (
                <button
                  key={u.uid}
                  className="admin-user-item"
                  onClick={() => admin.fetchUserBooks(u.uid)}
                >
                  <div className="admin-user-email">{u.email}</div>
                  <div className="admin-user-count">{u.bookCount || 0} books</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
```

### 4. Create AdminPage Styles

**File**: `src/components/AdminPage.css` (renamed from AdminPanel.css)

```css
.admin-page {
  min-height: 100vh;
  background: var(--color-background);
}

.admin-header {
  position: sticky;
  top: 0;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  z-index: 10;
}

.admin-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  flex: 1;
}

.admin-back {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--color-primary);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.admin-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  position: sticky;
  top: 3.5rem;
  z-index: 9;
}

.admin-tab {
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.admin-tab.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.admin-content {
  padding: 1rem;
}

.admin-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.admin-empty {
  text-align: center;
  color: var(--color-text-secondary);
  padding: 2rem;
}

.admin-users,
.admin-books,
.admin-lists {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin-user-item,
.admin-list-item {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 1rem;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.admin-user-item:hover,
.admin-list-item:hover {
  background: var(--color-background);
  border-color: var(--color-primary);
}

.admin-user-email,
.admin-list-name {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.admin-user-count,
.admin-list-count {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.admin-book-item {
  padding: 0.75rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.admin-book-title {
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.admin-book-author {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}
```

### 5. Update Routing

**File**: `src/main.jsx`

Add admin route:

```javascript
import AdminRoute from './components/AdminRoute.jsx'

// Inside <Routes>
<Route path="/admin" element={<AdminRoute />} />
```

### 6. Update HamburgerMenu Navigation

**File**: `src/components/HamburgerMenu.jsx`

Change from callback to navigation:

```javascript
import { useNavigate } from 'react-router-dom'

function HamburgerMenu({ isOpen, onClose, isAdmin, ... }) {
  const navigate = useNavigate()

  // Update admin panel button
  {isAdmin && (
    <button 
      className="menu-item"
      onClick={() => {
        onClose()
        navigate('/admin')
      }}
    >
      <span className="menu-icon">⚙️</span>
      Admin Panel
    </button>
  )}
}
```

### 7. Clean Up App.jsx

**File**: `src/App.jsx`

Remove admin modal:

```javascript
// Remove these imports
import AdminPanel from './components/AdminPanel'
import { useAdmin } from './hooks/useAdmin'
import { isAdmin } from './config/adminConfig'

// Remove these states
const [showAdminPanel, setShowAdminPanel] = useState(false)
const admin = useAdmin(user)
const userIsAdmin = (user?.email && isAdmin(user.email)) || isEmulatorMode

// Remove this prop from HamburgerMenu
onOpenAdmin={() => setShowAdminPanel(true)}

// Remove admin modal render
{showAdminPanel && (
  <AdminPanel ... />
)}
```

### 8. Delete Old Files

- Delete: `src/components/AdminPanel.jsx`
- Delete: `src/components/AdminPanel.css` (replaced by AdminPage.css)

## Data Flow

```
AdminRoute
  ├─ Check auth → redirect to / if not signed in
  ├─ Check admin access → redirect to / if not admin
  ├─ Fetch users on mount
  └─ Render AdminPage with:
      - admin: { users, userBooks, userLists, selectedUser, selectedList, ... }
      - onBack: function to navigate to /

AdminPage
  ├─ No selectedUser → User List View
  ├─ selectedList exists → List Detail View
  │   └─ Shows books on list (with "Missing Book" placeholders)
  └─ selectedUser exists → User Detail View with tabs
      ├─ Books tab → shows userBooks
      └─ Lists tab → shows userLists
          └─ Click list → set selectedList → show List Detail
```

## File Changes Summary

### Create
- ✅ `src/components/AdminRoute.jsx` - Route wrapper with access control
- ✅ `src/components/AdminPage.jsx` - Main admin UI with tabs and drill-down
- ✅ `src/components/AdminPage.css` - Styles for admin page

### Update
- ✅ `src/hooks/useAdmin.js` - Add list fetching capabilities
- ✅ `src/main.jsx` - Add `/admin` route
- ✅ `src/App.jsx` - Remove admin modal state and render
- ✅ `src/components/HamburgerMenu.jsx` - Navigate to `/admin` instead of callback

### Delete
- ✅ `src/components/AdminPanel.jsx` - Replaced by AdminPage
- ✅ `src/components/AdminPanel.css` - Replaced by AdminPage.css

## Testing Checklist

### Access Control
- [ ] Navigate to `/admin` as admin user → shows admin panel
- [ ] Navigate to `/admin` as non-admin → redirects to `/`
- [ ] Navigate to `/admin` while signed out → redirects to `/`

### Navigation
- [ ] Hamburger menu "Admin Panel" link navigates to `/admin`
- [ ] Back button in admin header returns to `/`
- [ ] Back button in user detail returns to user list
- [ ] Back button in list detail returns to Lists tab

### User List
- [ ] User list loads and displays correctly
- [ ] Each user shows email and book count
- [ ] Clicking user navigates to user detail (Books tab)

### Books Tab
- [ ] Shows by default when viewing a user
- [ ] Displays user's books correctly
- [ ] Shows "No books" message for users with no books

### Lists Tab
- [ ] Click "Lists" tab → fetches and displays user's lists
- [ ] Each list shows name and book count
- [ ] Shows "No lists" message for users with no lists
- [ ] Clicking a list drills down to list detail

### List Detail
- [ ] Shows list name in header
- [ ] Displays books on the list
- [ ] Missing books show as "Missing Book" / "Unknown"
- [ ] Back button returns to Lists tab

### Edge Cases
- [ ] User with no books → shows "No books" message
- [ ] User with no lists → shows "No lists" message
- [ ] List with no books → shows "No books on this list"
- [ ] List with missing bookIds → shows placeholder entries
- [ ] Loading states display correctly

## Implementation Order

1. Update `useAdmin.js` hook with list fetching
2. Create `AdminRoute.jsx` with access control
3. Create `AdminPage.jsx` with tab navigation and drill-down
4. Create `AdminPage.css` styles
5. Update routing in `main.jsx`
6. Update `HamburgerMenu.jsx` navigation
7. Clean up `App.jsx` (remove modal)
8. Delete old `AdminPanel.jsx` and `AdminPanel.css`
9. Test all flows

## UI Mockup

```
┌─────────────────────────────────────┐
│ ← Library    Admin Panel            │
├─────────────────────────────────────┤
│                                     │
│  user@example.com                   │
│  5 books                        →   │
│                                     │
│  another@example.com                │
│  12 books                       →   │
│                                     │
└─────────────────────────────────────┘

Click user → User Detail:

┌─────────────────────────────────────┐
│ ←          user@example.com         │
├─────────────────────────────────────┤
│   Books    │   Lists                │
├─────────────────────────────────────┤
│                                     │
│  The Great Gatsby                   │
│  F. Scott Fitzgerald                │
│                                     │
│  To Kill a Mockingbird              │
│  Harper Lee                         │
│                                     │
└─────────────────────────────────────┘

Click "Lists" tab:

┌─────────────────────────────────────┐
│ ←          user@example.com         │
├─────────────────────────────────────┤
│   Books    │   Lists                │
├─────────────────────────────────────┤
│                                     │
│  Reading List 2024              →   │
│  3 books                            │
│                                     │
│  Favorites                      →   │
│  7 books                            │
│                                     │
└─────────────────────────────────────┘

Click list → List Detail:

┌─────────────────────────────────────┐
│ ←          Reading List 2024        │
├─────────────────────────────────────┤
│                                     │
│  The Great Gatsby                   │
│  F. Scott Fitzgerald                │
│                                     │
│  Missing Book                       │
│  Unknown                            │
│                                     │
│  To Kill a Mockingbird              │
│  Harper Lee                         │
│                                     │
└─────────────────────────────────────┘
```
