import { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import BookList from './components/BookList'
import BookDetailModal from './components/BookDetailModal'
import BookFormModal from './components/BookFormModal'
import BarcodeScannerModal from './components/BarcodeScannerModal'
import HamburgerMenu from './components/HamburgerMenu'
import SignInPrompt from './components/SignInPrompt'
import AdminPanel from './components/AdminPanel'
import { useAuth } from './hooks/useAuth'
import { useBooks } from './hooks/useBooks'
import { useAdmin } from './hooks/useAdmin'
import { isAdmin } from './config/adminConfig'
import { generateTestBooks } from './utils/testData'
import './App.css'

function App() {
  const { user, loading: authLoading, signIn, signOut } = useAuth()
  const { books, loading: booksLoading, addBook, updateBook, deleteBook, setAllBooks } = useBooks(user)
  const admin = useAdmin(user)
  const userIsAdmin = user?.email && isAdmin(user.email)

  const [searchQuery, setSearchQuery] = useState('')
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [showHamburger, setShowHamburger] = useState(false)
  const [editingBook, setEditingBook] = useState(null)
  const [selectedBook, setSelectedBook] = useState(null)
  const [searchExpanded, setSearchExpanded] = useState(false)

  const handleLoadTestData = () => {
    const testBooks = generateTestBooks()
    setAllBooks(testBooks)
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all books? This cannot be undone.')) {
      setAllBooks([])
    }
  }

  const handleExport = () => {
    const dataStr = JSON.stringify(books, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `library-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleImport = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result)
        if (Array.isArray(imported)) {
          setAllBooks(imported)
          alert(`Successfully imported ${imported.length} books`)
        } else {
          alert('Invalid file format. Expected an array of books.')
        }
      } catch (error) {
        console.error('Import error:', error)
        alert('Failed to import file. Please check the file format.')
      }
    }
    reader.readAsText(file)

    // Reset input so same file can be imported again
    event.target.value = ''
  }

  // Fuzzy search implementation
  const fuse = useMemo(() => {
    return new Fuse(books, {
      keys: ['title', 'author', 'isbn', 'publisher'],
      threshold: 0.3,
      includeScore: true
    })
  }, [books])

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) {
      return books
    }
    const results = fuse.search(searchQuery)
    return results.map(result => result.item)
  }, [books, searchQuery, fuse])

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

  // Not signed in: show sign-in prompt
  if (!user) {
    return <SignInPrompt onSignIn={signIn} />
  }

  // Books loading state
  if (booksLoading) {
    return (
      <div className="app">
        <div className="loading-state">
          <div className="loading-spinner" />
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            {searchExpanded ? (
              <div className="header-search-mode">
                <button
                  className="header-back-btn"
                  onClick={() => {
                    setSearchExpanded(false)
                    setSearchQuery('')
                  }}
                  aria-label="Close search"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                </button>
                <div className="header-search-bar">
                  <svg className="header-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    className="header-search-input"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      className="header-search-clear"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <path fill="var(--color-primary)" d="M15.5 8.5l-7 7M8.5 8.5l7 7" stroke="var(--color-primary)" strokeWidth="2"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                <h1 className="logo">Library</h1>
                <div className="header-right">
                  {books.length > 0 && (
                    <button
                      className="header-search-btn"
                      onClick={() => setSearchExpanded(true)}
                      aria-label="Search"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="M21 21l-4.35-4.35"/>
                      </svg>
                    </button>
                  )}
                  <button
                    className="hamburger-btn"
                    onClick={() => setShowHamburger(true)}
                    aria-label="Open menu"
                  >
                    ☰
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        {books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h2>Your library awaits</h2>
            <p>Start building your collection by adding your first book</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h2>No books found</h2>
            <p>Try adjusting your search query</p>
          </div>
        ) : (
          <BookList
            books={filteredBooks}
            onBookClick={setSelectedBook}
            totalBooks={books.length}
            totalAuthors={new Set(books.map(b => b.author)).size}
          />
        )}
      </main>

      {selectedBook && (
        <BookDetailModal
          book={selectedBook}
          onClose={() => setSelectedBook(null)}
          onEdit={setEditingBook}
          onDelete={deleteBook}
        />
      )}

      {showAddModal && (
        <BookFormModal
          onClose={() => setShowAddModal(false)}
          onSave={addBook}
          books={books}
        />
      )}

      {editingBook && (
        <BookFormModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={updateBook}
        />
      )}

      {showScannerModal && (
        <BarcodeScannerModal
          onClose={() => setShowScannerModal(false)}
          onAdd={addBook}
          books={books}
        />
      )}

      <HamburgerMenu
        isOpen={showHamburger}
        onClose={() => setShowHamburger(false)}
        onAddBook={() => setShowAddModal(true)}
        onImport={handleImport}
        onExport={handleExport}
        onLoadTestData={handleLoadTestData}
        onClearAll={handleClearAll}
        hasBooks={books.length > 0}
        user={user}
        onSignOut={signOut}
        isAdmin={userIsAdmin}
        onOpenAdmin={() => setShowAdminPanel(true)}
      />

      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          users={admin.users}
          userBooks={admin.userBooks}
          loading={admin.loading}
          selectedUser={admin.selectedUser}
          fetchUsers={admin.fetchUsers}
          fetchUserBooks={admin.fetchUserBooks}
          clearSelectedUser={admin.clearSelectedUser}
        />
      )}

      {/* Floating Action Button for barcode scanning */}
      <button
        className="fab"
        onClick={() => setShowScannerModal(true)}
        aria-label="Scan barcode"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
          <path d="M4 4h2v16H4V4zm3 0h1v16H7V4zm2 0h2v16H9V4zm3 0h2v16h-2V4zm3 0h1v16h-1V4zm2 0h3v16h-3V4z"/>
        </svg>
      </button>
    </div>
  )
}

export default App
