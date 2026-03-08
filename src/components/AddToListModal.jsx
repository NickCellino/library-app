import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import Fuse from 'fuse.js'
import { readBarcodes } from 'zxing-wasm/reader'
import { v4 as uuidv4 } from '../utils/uuid'
import { fetchBookByISBN } from '../utils/googleBooksApi'
import BookCard from './BookCard'
import './AddToListModal.css'

const COOLDOWN_MS = 5000 // 5s cooldown before re-scanning same ISBN

function AddToListModal({ isOpen, onClose, list, books, onAddBook, onAddNewBook }) {
  const [activeTab, setActiveTab] = useState('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [addedBookIds, setAddedBookIds] = useState(new Set())
  const [booksAddedCount, setBooksAddedCount] = useState(0)
  const [currentToast, setCurrentToast] = useState(null)
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingISBN, setLoadingISBN] = useState('')

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const isProcessingRef = useRef(false)
  const recentISBNs = useRef(new Map()) // ISBN -> timestamp
  const toastTimeoutRef = useRef(null)
  const booksRef = useRef(books)
  const listRef = useRef(list)

  useEffect(() => {
    booksRef.current = books
  }, [books])

  useEffect(() => {
    listRef.current = list
  }, [list])

  useEffect(() => {
    return () => {
      stopCamera()
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  const showToast = useCallback((toast) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    setCurrentToast(toast)
    toastTimeoutRef.current = setTimeout(() => {
      setCurrentToast(null)
    }, 2500)
  }, [])

  const isOnCooldown = (isbn) => {
    const lastScan = recentISBNs.current.get(isbn)
    if (!lastScan) return false
    return Date.now() - lastScan < COOLDOWN_MS
  }

  const addToCooldown = (isbn) => {
    recentISBNs.current.set(isbn, Date.now())
  }

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

  if (!isOpen || !list) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      stopCamera()
      onClose()
    }
  }

  const handleClose = () => {
    stopCamera()
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

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    setIsScanning(false)
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play()
          startScanLoop()
        }
      }
      setIsScanning(true)
    } catch (err) {
      console.error('Error starting camera:', err)
      showToast({ type: 'error', message: 'Could not access camera' })
    }
  }

  const startScanLoop = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const scan = async () => {
      if (!streamRef.current) return

      if (isProcessingRef.current) {
        animationFrameRef.current = requestAnimationFrame(scan)
        return
      }

      ctx.drawImage(video, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      try {
        const results = await readBarcodes(imageData, {
          formats: ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E']
        })

        if (results.length > 0) {
          const isbn = results[0].text
          if (!isOnCooldown(isbn)) {
            isProcessingRef.current = true
            addToCooldown(isbn)
            await processISBN(isbn)
          }
        }
      } catch (err) {
        // Ignore decode errors
      }

      animationFrameRef.current = requestAnimationFrame(scan)
    }

    animationFrameRef.current = requestAnimationFrame(scan)
  }

  const processISBN = async (isbn) => {
    setIsLoading(true)
    setLoadingISBN(isbn)

    try {
      // Check if book exists in library
      const existingBook = booksRef.current.find(b => b.isbn && b.isbn === isbn)
      
      if (existingBook) {
        // Check if already in list
        if (listRef.current.bookIds.includes(existingBook.id)) {
          showToast({ type: 'info', message: 'Already in list' })
        } else {
          // Add to list
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
          showToast({ type: 'success', book: newBook, message: 'Added to library and list' })
        } else {
          showToast({ type: 'error', message: `ISBN ${isbn} not found` })
        }
      }
    } catch (error) {
      console.error('Error processing ISBN:', error)
      showToast({ type: 'error', message: error.message })
    } finally {
      setIsLoading(false)
      setLoadingISBN('')
      isProcessingRef.current = false
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
    <div className="add-to-list-overlay" onClick={handleBackdropClick}>
      <div className="add-to-list-modal">
        <button className="add-to-list-close" onClick={handleClose}>×</button>

        <div className="add-to-list-header">
          <h2>Add to "{list.name}"</h2>
        </div>

        <div className="add-to-list-tabs">
          <button 
            className={`add-to-list-tab ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => handleTabChange('search')}
          >
            Search
          </button>
          <button 
            className={`add-to-list-tab ${activeTab === 'scan' ? 'active' : ''}`}
            onClick={() => handleTabChange('scan')}
          >
            Scan
          </button>
        </div>

        <div className="add-to-list-content">
          {activeTab === 'search' && (
            <div className="add-to-list-search">
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="add-to-list-search-input"
              />
              
              <div className="add-to-list-results">
                {searchResults.map(book => (
                  <div 
                    key={book.id} 
                    className="add-to-list-result-item"
                    onClick={() => handleAddBook(book.id)}
                  >
                    <BookCard book={book} onClick={() => {}} />
                    {addedBookIds.has(book.id) && (
                      <div className="add-to-list-added-badge">✓</div>
                    )}
                  </div>
                ))}
                
                {searchResults.length === 0 && (
                  <div className="add-to-list-empty">
                    <p>No books found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="add-to-list-scan">
              <div className="add-to-list-camera">
                <video ref={videoRef} playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                
                {!isScanning && (
                  <div className="add-to-list-camera-placeholder">
                    <p>Starting camera...</p>
                  </div>
                )}
              </div>

              {isLoading && (
                <div className="add-to-list-loading">
                  Loading ISBN: {loadingISBN}...
                </div>
              )}

              <div className="add-to-list-counter">
                Added: {booksAddedCount} books
              </div>
            </div>
          )}
        </div>

        {currentToast && (
          <div className={`add-to-list-toast add-to-list-toast-${currentToast.type}`}>
            {currentToast.book && (
              <div className="add-to-list-toast-book">
                <span className="add-to-list-toast-title">{currentToast.book.title}</span>
                <span className="add-to-list-toast-author">{currentToast.book.author}</span>
                <span className="add-to-list-toast-status">
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

export default AddToListModal
