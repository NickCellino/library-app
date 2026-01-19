import { useState, useEffect, useMemo } from 'react'
import Fuse from 'fuse.js'
import BookList from './components/BookList'
import AddBookModal from './components/AddBookModal'
import EditBookModal from './components/EditBookModal'
import BarcodeScannerModal from './components/BarcodeScannerModal'
import { generateTestBooks } from './utils/testData'
import './App.css'

function App() {
  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('author')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showScannerModal, setShowScannerModal] = useState(false)
  const [editingBook, setEditingBook] = useState(null)

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
    setEditingBook(book)
  }

  const handleSaveEdit = (updatedBook) => {
    setBooks(books.map(b => b.id === updatedBook.id ? updatedBook : b))
  }

  const handleDelete = (bookId) => {
    if (window.confirm('Are you sure you want to delete this book?')) {
      setBooks(books.filter(b => b.id !== bookId))
    }
  }

  const handleAddBook = (newBook) => {
    setBooks([...books, newBook])
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
          setBooks(imported)
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

          {books.length > 0 && (
            <div className="actions">
              <button className="btn btn-secondary" onClick={handleExport}>
                Export Library
              </button>
              <label className="btn btn-secondary" style={{ margin: 0, cursor: 'pointer' }}>
                Import Library
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          )}
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

      {editingBook && (
        <EditBookModal
          book={editingBook}
          onClose={() => setEditingBook(null)}
          onSave={handleSaveEdit}
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
