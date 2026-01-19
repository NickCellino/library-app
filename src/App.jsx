import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [books, setBooks] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('author')

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
            <button className="btn btn-primary">Add Book</button>
            <button className="btn btn-secondary">Scan Barcode</button>
          </div>
        </div>

        {books.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📚</div>
            <h2>Your library awaits</h2>
            <p>Start building your collection by adding your first book</p>
          </div>
        ) : (
          <div className="book-list">
            <p>Books will appear here</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
