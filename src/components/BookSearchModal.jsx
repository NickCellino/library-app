import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from '../utils/uuid'
import { searchBooks } from '../utils/googleBooksApi'
import { playSound } from '../utils/soundManager'
import './BookSearchModal.css'

function BookSearchModal({ onClose, onAdd, books = [] }) {
  const [titleQuery, setTitleQuery] = useState('')
  const [authorQuery, setAuthorQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState([])
  const [error, setError] = useState(null)
  const [currentToast, setCurrentToast] = useState(null)
  const [booksAdded, setBooksAdded] = useState(0)

  const debounceTimerRef = useRef(null)
  const toastTimeoutRef = useRef(null)
  const booksRef = useRef(books)

  // Keep books ref updated
  useEffect(() => {
    booksRef.current = books
  }, [books])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    const title = titleQuery.trim()
    const author = authorQuery.trim()

    // Clear results if both queries too short
    if (title.length < 2 && author.length < 2) {
      setResults([])
      setError(null)
      return
    }

    // Set new timer
    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      setError(null)

      try {
        // Build structured query
        let query = ''
        if (title) query += `intitle:${title}`
        if (author) query += `${query ? '+' : ''}inauthor:${author}`

        const searchResults = await searchBooks(query)
        setResults(searchResults)
      } catch (err) {
        console.error('[Search] Error:', err)
        setError(err.message)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 500)

    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [titleQuery, authorQuery])

  const showToast = useCallback((toast) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setCurrentToast(toast)

    // Only auto-dismiss if not interactive
    if (!toast.interactive) {
      toastTimeoutRef.current = setTimeout(() => {
        setCurrentToast(null)
      }, 2500)
    }
  }, [])

  const handleDismissToast = useCallback(() => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setCurrentToast(null)
  }, [])

  const handleAddDuplicate = useCallback(async (bookData) => {
    setCurrentToast(null)

    const newBook = {
      id: uuidv4(),
      ...bookData,
      dateAdded: new Date().toISOString()
    }

    onAdd(newBook)
    setBooksAdded(prev => prev + 1)
    playSound()
    showToast({ type: 'success', book: newBook })
  }, [onAdd, showToast])

  const handleSelectBook = useCallback(async (bookData) => {
    // Check for duplicate by ISBN
    if (bookData.isbn) {
      const existing = booksRef.current.find(b => b.isbn && b.isbn === bookData.isbn)
      if (existing) {
        showToast({
          type: 'duplicate',
          book: existing,
          interactive: true,
          onAction: () => handleAddDuplicate(bookData)
        })
        return
      }
    }

    // Add new book
    const newBook = {
      id: uuidv4(),
      ...bookData,
      dateAdded: new Date().toISOString()
    }

    onAdd(newBook)
    setBooksAdded(prev => prev + 1)
    playSound()
    showToast({ type: 'success', book: newBook })
  }, [onAdd, showToast, handleAddDuplicate])

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Search Books</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="search-content">
          {/* Search inputs */}
          <div className="search-input-container">
            <input
              type="text"
              className="search-input"
              placeholder="Title"
              value={titleQuery}
              onChange={(e) => setTitleQuery(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              className="search-input"
              placeholder="Author"
              value={authorQuery}
              onChange={(e) => setAuthorQuery(e.target.value)}
            />
          </div>

          {/* Results area */}
          <div className="search-results-area">
            {/* Loading state */}
            {isSearching && (
              <div className="search-empty">
                <div className="search-spinner"></div>
                <p>Searching...</p>
              </div>
            )}

            {/* Empty states */}
            {!isSearching && titleQuery.trim().length === 0 && authorQuery.trim().length === 0 && (
              <div className="search-empty">
                <span className="search-icon">🔍</span>
                <p>Enter title or author to search...</p>
              </div>
            )}

            {!isSearching && (titleQuery.trim().length > 0 || authorQuery.trim().length > 0) &&
             (titleQuery.trim().length < 2 && authorQuery.trim().length < 2) && (
              <div className="search-empty">
                <span className="search-icon">⌨️</span>
                <p>Type at least 2 characters</p>
              </div>
            )}

            {!isSearching && (titleQuery.trim().length >= 2 || authorQuery.trim().length >= 2) &&
             results.length === 0 && !error && (
              <div className="search-empty">
                <span className="search-icon">📚</span>
                <p>No results found</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="search-empty search-error">
                <span className="search-icon">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {/* Results list */}
            {!isSearching && results.length > 0 && (
              <div className="search-results">
                {results.map((book, index) => (
                  <button
                    key={index}
                    className="search-result-card"
                    onClick={() => handleSelectBook(book)}
                  >
                    <div className="result-cover">
                      {book.coverUrl ? (
                        <img src={book.coverUrl} alt="" />
                      ) : (
                        <div className="result-cover-placeholder">📖</div>
                      )}
                    </div>
                    <div className="result-info">
                      <div className="result-title">{book.title}</div>
                      <div className="result-author">{book.author}</div>
                      {book.publishYear && (
                        <div className="result-year">{book.publishYear}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Toast notification */}
          {currentToast && (
            <div className={`search-toast search-toast-${currentToast.type}`}>
              {currentToast.type === 'success' && currentToast.book && (
                <>
                  <div className="toast-cover">
                    {currentToast.book.coverUrl ? (
                      <img src={currentToast.book.coverUrl} alt="" />
                    ) : (
                      <div className="toast-cover-placeholder">📖</div>
                    )}
                  </div>
                  <div className="toast-info">
                    <div className="toast-title">{currentToast.book.title}</div>
                    <div className="toast-author">{currentToast.book.author}</div>
                    <div className="toast-status">Added ✓</div>
                  </div>
                </>
              )}
              {currentToast.type === 'duplicate' && currentToast.book && (
                <>
                  <div className="toast-cover">
                    {currentToast.book.coverUrl ? (
                      <img src={currentToast.book.coverUrl} alt="" />
                    ) : (
                      <div className="toast-cover-placeholder">📖</div>
                    )}
                  </div>
                  <div className="toast-info">
                    <div className="toast-title">{currentToast.book.title}</div>
                    <div className="toast-author">{currentToast.book.author}</div>
                    <div className="toast-status toast-status-warn">Already in library</div>
                    {currentToast.interactive && (
                      <div className="toast-actions">
                        <button
                          className="toast-btn toast-btn-secondary"
                          onClick={handleDismissToast}
                        >
                          Cancel
                        </button>
                        <button
                          className="toast-btn toast-btn-primary"
                          onClick={currentToast.onAction}
                        >
                          Add Anyway
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="search-footer">
          <span className="search-count">Added: {booksAdded} book{booksAdded !== 1 ? 's' : ''}</span>
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookSearchModal
