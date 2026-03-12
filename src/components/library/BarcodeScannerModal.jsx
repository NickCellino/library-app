import { useState, useEffect, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from '../../utils/uuid'
import { fetchBookByISBN } from '../../utils/googleBooksApi'
import { useBarcodeScanner } from '../../hooks/useBarcodeScanner'
import './BarcodeScannerModal.css'

const COOLDOWN_MS = 30000

function BarcodeScannerModal({ onClose, onAdd, books = [] }) {
  const [booksAdded, setBooksAdded] = useState(0)

  const booksRef = useRef(books)

  // Keep books ref updated
  useEffect(() => {
    booksRef.current = books
  }, [books])

  const handleScan = useCallback(async (isbn, helpers) => {
    const { showToast, dismissToast, removeFromCooldown, resetProcessing } = helpers

    // Check for duplicate
    const existing = booksRef.current.find(b => b.isbn && b.isbn === isbn)
    if (existing) {
      showToast({
        type: 'duplicate',
        book: existing,
        interactive: true,
        onAction: () => handleAddDuplicate(isbn, helpers)
      })
      resetProcessing()
      return
    }

    try {
      const bookData = await fetchBookByISBN(isbn)

      if (bookData) {
        const newBook = {
          id: uuidv4(),
          isbn: isbn,
          ...bookData,
          dateAdded: new Date().toISOString()
        }

        onAdd(newBook)
        setBooksAdded(prev => prev + 1)
        showToast({ type: 'success', book: newBook })
      } else {
        showToast({ type: 'error', message: `ISBN ${isbn} not found` })
      }
    } catch (error) {
      console.error('[Scanner] Error fetching book:', error)
      showToast({ type: 'error', message: `Failed to fetch: ${error.message}` })
    }
  }, [onAdd])

  const handleAddDuplicate = useCallback(async (isbn, helpers) => {
    const { showToast, dismissToast, removeFromCooldown, resetProcessing } = helpers

    dismissToast()

    // Remove from cooldown to allow re-processing
    removeFromCooldown(isbn)

    // Re-fetch from Google Books API
    try {
      const bookData = await fetchBookByISBN(isbn)
      if (bookData) {
        const newBook = {
          id: uuidv4(),
          isbn: isbn,
          ...bookData,
          dateAdded: new Date().toISOString()
        }
        onAdd(newBook)
        setBooksAdded(prev => prev + 1)
        showToast({ type: 'success', book: newBook })
      } else {
        showToast({ type: 'error', message: `ISBN ${isbn} not found` })
      }
    } catch (error) {
      showToast({ type: 'error', message: `Failed: ${error.message}` })
    } finally {
      resetProcessing()
    }
  }, [onAdd])

  const handleScanError = useCallback((error) => {
    console.error('[BarcodeScannerModal] Scan error:', error)
  }, [])

  const {
    videoRef,
    canvasRef,
    isScanning,
    isLoading,
    loadingISBN,
    currentToast,
    dismissToast
  } = useBarcodeScanner({
    cooldownMs: COOLDOWN_MS,
    onScan: handleScan,
    onError: handleScanError,
    isEnabled: true
  })

  const handleDismissToast = useCallback(() => {
    dismissToast()
  }, [dismissToast])

  const handleDone = () => {
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={handleDone}>
      <div className="modal-content scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Scan Books</h2>
          <button className="modal-close" onClick={handleDone}>
            ✕
          </button>
        </div>

        <div className="scanner-content">
          {/* Camera view - always shown when scanning */}
          {isScanning && (
            <div className="scanner-view">
              <div className="video-container">
                <video ref={videoRef} playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="scan-overlay">
                  <div className="scan-frame"></div>
                </div>
                {isLoading && (
                  <div className="scan-loading">
                    <span>Looking up {loadingISBN}...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Toast notification */}
          {currentToast && (
            <div className={`scan-toast scan-toast-${currentToast.type}`}>
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
                          Keep Scanning
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
              {currentToast.type === 'error' && (
                <div className="toast-error">
                  <span className="toast-error-icon">⚠</span>
                  <span>{currentToast.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with count and Done button */}
        <div className="scanner-footer">
          <span className="scanner-count">Added: {booksAdded} book{booksAdded !== 1 ? 's' : ''}</span>
          <button className="btn btn-primary" onClick={handleDone}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default BarcodeScannerModal
