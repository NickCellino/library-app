import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import Fuse from 'fuse.js'
import { v4 as uuidv4 } from '../../utils/uuid'
import { fetchBookByISBN } from '../../utils/googleBooksApi'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import BookCard from '../library/BookCard'
import './AddToTBRListModal.css'

const COOLDOWN_MS = 5000

function AddToTBRListModal({ isOpen, onClose, tbrList, books, onAddBook, onAddNewBook }) {
  const [activeTab, setActiveTab] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [addedBookIds, setAddedBookIds] = useState(new Set())
  const [booksAddedCount, setBooksAddedCount] = useState(0)

  const tbrListRef = useRef(tbrList)
  const booksRef = useRef(books)

  useEffect(() => {
    booksRef.current = books
  }, [books])

  useEffect(() => {
    tbrListRef.current = tbrList
  }, [tbrList])

  const handleScan = useCallback(async (isbn, { showToast }) => {
    // Check if book exists in library
    const existingBook = booksRef.current.find(b => b.isbn && b.isbn === isbn)
    
    if (existingBook) {
      // Check if already in TBR list
      if (tbrListRef.current.bookIds.includes(existingBook.id)) {
        showToast({ type: 'info', message: 'Already in TBR list' })
      } else {
        // Add to TBR list
        await onAddBook(existingBook.id)
        setAddedBookIds(prev => new Set([...prev, existingBook.id]))
        setBooksAddedCount(prev => prev + 1)
        showToast({ type: 'success', book: existingBook })
      }
    } else {
      // Book not in library - fetch from Google Books and add
      const bookData = await fetchBookByISBN(isbn)
      
      if (bookData) {
        const newBook = {
          id: uuidv4(),
          isbn: isbn,
          ...bookData,
          dateAdded: new Date().toISOString()
        }
        
        await onAddNewBook(newBook)
        setAddedBookIds(prev => new Set([...prev, newBook.id]))
        setBooksAddedCount(prev => prev + 1)
        showToast({ type: 'success', book: newBook, message: 'Added to library and TBR list' })
      } else {
        showToast({ type: 'error', message: `ISBN ${isbn} not found` })
      }
    }
  }, [onAddBook, onAddNewBook])

  const handleScanError = useCallback((error) => {
    console.error('[AddToTBRListModal] Scan error:', error)
  }, [])

  const {
    videoRef,
    canvasRef,
    isScanning,
    isLoading,
    loadingISBN,
    currentToast,
    startCamera,
    stopCamera,
    showToast
  } = useBarcodeScanner({
    cooldownMs: COOLDOWN_MS,
    onScan: handleScan,
    onError: handleScanError,
    isEnabled: isOpen && activeTab === 'scan'
  })

  const fuse = useMemo(() => {
    return new Fuse(books, {
      keys: ['title', 'author', 'isbn', 'publisher'],
      threshold: 0.3,
      includeScore: true
    })
  }, [books])

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return books
    }
    const results = fuse.search(searchQuery)
    return results.map(result => result.item)
  }, [books, searchQuery, fuse])

  if (!isOpen || !tbrList) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handleClose = () => {
    onClose()
  }

  const handleAddBook = async (bookId) => {
    if (addedBookIds.has(bookId)) return

    try {
      await onAddBook(bookId)
      setAddedBookIds(prev => new Set([...prev, bookId]))
      setBooksAddedCount(prev => prev + 1)
      const book = books.find(b => b.id === bookId)
      if (book) {
        showToast({ type: 'success', book })
      }
    } catch (error) {
      showToast({ type: 'error', message: error.message })
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    if (tab === 'scan') {
      startCamera()
    } else {
      stopCamera()
    }
  }

  return (
    <div className="add-to-tbr-overlay" onClick={handleBackdropClick}>
      <div className="add-to-tbr-modal">
        <button className="add-to-tbr-close" onClick={handleClose}>×</button>

        <div className="add-to-tbr-header">
          <h2>Add to "{tbrList.name}"</h2>
        </div>

        <div className="add-to-tbr-tabs">
          <button 
            className={`add-to-tbr-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleTabChange('search')}
          >
            Search
          </button>
          <button 
            className={`add-to-tbr-tab ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => handleTabChange('scan')}
          >
            Scan
          </button>
        </div>

        <div className="add-to-tbr-content">
          {activeTab === 'search' && (
            <div className="add-to-tbr-search">
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="add-to-tbr-search-input"
              />
              
              <div className="add-to-tbr-results">
                {searchResults.map(book => (
                  <div 
                    key={book.id} 
                    className="add-to-tbr-result-item"
                    onClick={() => handleAddBook(book.id)}
                  >
                    <BookCard book={book} onClick={() => {}} />
                    {addedBookIds.has(book.id) && (
                      <div className="add-to-tbr-added-badge">✓</div>
                    )}
                  </div>
                ))}
                
                {searchResults.length === 0 && (
                  <div className="add-to-tbr-empty">
                    <p>No books found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="add-to-tbr-scan">
              <div className="add-to-tbr-camera">
                <video ref={videoRef} playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {!isScanning && (
                  <div className="add-to-tbr-camera-placeholder">
                    <p>Starting camera...</p>
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="add-to-tbr-loading">
                  Loading ISBN: {loadingISBN}...
                </div>
              )}

              <div className="add-to-tbr-counter">
                Added: {booksAddedCount} books
              </div>
            </div>
          )}
        </div>

        {currentToast && (
          <div className={`add-to-tbr-toast add-to-tbr-toast-${currentToast.type}`}>
            {currentToast.book && (
              <div className="add-to-tbr-toast-book">
                <span className="add-to-tbr-toast-title">{currentToast.book.title}</span>
                <span className="add-to-tbr-toast-author">{currentToast.book.author}</span>
                <span className="add-to-tbr-toast-status">
                  {currentToast.message || 'Added ✓'}
                </span>
              </div>
            )}
            {currentToast.message && !currentToast.book && (
              <span>{currentToast.message}</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default AddToTBRListModal
