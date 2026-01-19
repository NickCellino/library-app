import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import BookList from './components/BookList'
import AddBookModal from './components/AddBookModal'
import BarcodeScannerModal from './components/BarcodeScannerModal'
import { generateTestBooks } from './utils/testData'
import './App.css'

function App() {
  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('author')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)

  // Load books from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('library-books')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setBooks(parsed)
      } catch (e) {
        console.error('Failed to parse stored books:', e)
      }
    }
  }, [])

  // Save books to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('library-books', JSON.stringify(books))
  }, [books])

  const handleLoadTestData = () => {
    const testBooks = generateTestBooks()
    setBooks(testBooks)
  }

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all books? This cannot be undone.')) {
      setBooks([])
    }
  }

  const handleEdit = (book) => {
    // TODO: Implement edit modal
    console.log('Edit book:', book)
  }

  const handleDelete = (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      setBooks(books.filter(b => b.id !== bookId))
    }
  }

  const handleAddBook = (newBook) => {
    setBooks([...books, newBook])
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

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <div className="header-content">
            <h1 className="logo">Library</h1>
            <div className="stats">
              <span className="stat">{books.length} books</span>
              <span className="stat-separator">·</span>
              <span className="stat">
                {new Set(books.map(b => b.author)).size} authors
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="main container">
        <div className="controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className="actions">
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              Add Book
            </button>
            <button className="btn btn-secondary" onClick={() => setShowScannerModal(true)}>
              Scan Barcode
            </button>
          </div>

          <div className="actions">
            <button className="btn btn-secondary" onClick={handleLoadTestData}>
              Load Test Data
            </button>
            {books.length > 0 && (
              <button className="btn btn-secondary" onClick={handleClearAll}>
                Clear All Books
              </button>
            )}
          </div>
        </div>

        {books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h2>Your library awaits</h2>
            <p>Start building your collection by adding your first book</p>
            <button className="btn btn-primary" onClick={handleLoadTestData} style={{ marginTop: 'var(--space-md)' }}>
              Load Test Data
            </button>
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
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {showAddModal && (
        <AddBookModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddBook}
        />
      )}

      {showScannerModal && (
        <BarcodeScannerModal
          onClose={() => setShowScannerModal(false)}
          onAdd={handleAddBook}
        />
      )}
    </div>
  )
}

export default App
