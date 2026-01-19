import { useState, useEffect, useRef, useCallback } from 'react'
import { readBarcodes } from 'zxing-wasm/reader'
import { v4 as uuidv4 } from '../utils/uuid'
import './BarcodeScannerModal.css'

const COOLDOWN_MS = 30000 // 30s cooldown before re-scanning same ISBN

function BarcodeScannerModal({ onClose, onAdd, books = [] }) {
  const [isScanning, setIsScanning] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingISBN, setLoadingISBN] = useState('')
  const [booksAdded, setBooksAdded] = useState(0)
  const [currentToast, setCurrentToast] = useState(null) // { type: 'success'|'duplicate'|'error', book?, message? }
  const [testModeActive, setTestModeActive] = useState(false)
  const [testHelpers, setTestHelpers] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const isProcessingRef = useRef(false)
  const recentISBNs = useRef(new Map()) // ISBN -> timestamp
  const toastTimeoutRef = useRef(null)
  const booksRef = useRef(books) // Keep fresh reference for duplicate check

  // Keep books ref updated
  useEffect(() => {
    booksRef.current = books
  }, [books])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
    }
  }, [])

  // Load test helpers and check for test mode on mount (dev only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      import('../utils/testModeHelpers.js').then(helpers => {
        setTestHelpers(helpers)
        if (helpers.isTestMode()) {
          setTestModeActive(true)
        } else {
          // Auto-start camera for real scanning
          setIsScanning(true)
        }
      })
    } else {
      // Production: auto-start camera
      setIsScanning(true)
    }
  }, [])

  const stopCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

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

  const processISBN = useCallback(async (isbn) => {
    // Check cooldown
    if (isOnCooldown(isbn)) {
      console.log('[Scanner] ISBN on cooldown:', isbn)
      isProcessingRef.current = false
      setIsLoading(false)
      setLoadingISBN('')
      return
    }

    addToCooldown(isbn)
    setIsLoading(true)
    setLoadingISBN(isbn)

    // Check for duplicate
    const existing = booksRef.current.find(b => b.isbn && b.isbn === isbn)
    if (existing) {
      showToast({ type: 'duplicate', book: existing })
      setIsLoading(false)
      setLoadingISBN('')
      isProcessingRef.current = false
      return
    }

    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()

      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo
        const newBook = {
          id: uuidv4(),
          isbn: isbn,
          title: book.title || '',
          author: book.authors?.[0] || '',
          publishYear: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
          publisher: book.publisher || '',
          pageCount: book.pageCount || null,
          coverUrl: book.imageLinks?.thumbnail || '',
          dateAdded: new Date().toISOString()
        }

        // Auto-add the book
        onAdd(newBook)
        setBooksAdded(prev => prev + 1)
        showToast({ type: 'success', book: newBook })
      } else {
        showToast({ type: 'error', message: `ISBN ${isbn} not found` })
      }
    } catch (error) {
      console.error('[Scanner] Error fetching book:', error)
      showToast({ type: 'error', message: `Failed to fetch: ${error.message}` })
    } finally {
      setIsLoading(false)
      setLoadingISBN('')
      isProcessingRef.current = false
    }
  }, [onAdd, showToast])

  // Test scan handler (dev only)
  const handleTestScan = async (isbn) => {
    if (!import.meta.env.DEV || !testHelpers) return

    isProcessingRef.current = true
    setIsLoading(true)
    setLoadingISBN(isbn)

    try {
      console.log('[TestMode] Loading barcode image for ISBN:', isbn)
      const imageData = await testHelpers.loadBarcodeImageData(isbn)

      console.log('[TestMode] Decoding barcode...')
      const results = await readBarcodes(imageData, {
        formats: ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E']
      })

      if (results.length > 0) {
        const decodedText = results[0].text
        console.log('[TestMode] Decoded:', decodedText)
        await processISBN(decodedText)
      } else {
        showToast({ type: 'error', message: 'Failed to decode barcode' })
        setIsLoading(false)
        setLoadingISBN('')
        isProcessingRef.current = false
      }
    } catch (err) {
      console.error('[TestMode] Error:', err)
      showToast({ type: 'error', message: `Test scan failed: ${err.message}` })
      setIsLoading(false)
      setLoadingISBN('')
      isProcessingRef.current = false
    }
  }

  // Initialize camera when isScanning becomes true
  useEffect(() => {
    if (!isScanning) return

    const initCamera = async () => {
      try {
        console.log('[Scanner] Starting camera...')

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
      } catch (err) {
        console.error('Error starting camera:', err)
        showToast({ type: 'error', message: 'Could not access camera' })
        setIsScanning(false)
      }
    }

    initCamera()
  }, [isScanning, showToast])

  const startScanLoop = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const scan = async () => {
      if (!streamRef.current) return // Camera stopped

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
          const decodedText = results[0].text

          if (!isOnCooldown(decodedText)) {
            isProcessingRef.current = true
            console.log('[Scanner] Barcode decoded:', decodedText)
            processISBN(decodedText)
          }
        }
      } catch (err) {
        // Ignore decode errors, keep scanning
      }

      animationFrameRef.current = requestAnimationFrame(scan)
    }

    animationFrameRef.current = requestAnimationFrame(scan)
  }

  const handleDone = () => {
    stopCamera()
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

          {/* Test mode panel (dev only) */}
          {import.meta.env.DEV && testModeActive && testHelpers && (
            <div className="test-mode-panel">
              <div className="test-mode-header">Test Mode</div>
              <p>Scan test barcodes without camera:</p>
              <div className="test-mode-buttons">
                {testHelpers.TEST_ISBNS.map(({ isbn, title }) => (
                  <button
                    key={isbn}
                    className="btn btn-secondary"
                    onClick={() => handleTestScan(isbn)}
                    disabled={isLoading}
                    data-testid={`test-scan-${title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {title}
                  </button>
                ))}
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
