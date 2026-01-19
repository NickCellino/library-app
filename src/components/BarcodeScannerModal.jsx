import { useState, useEffect, useRef } from 'react'
import { readBarcodes } from 'zxing-wasm/reader'
import { v4 as uuidv4 } from '../utils/uuid'
import './BarcodeScannerModal.css'

function BarcodeScannerModal({ onClose, onAdd, books = [] }) {
  const [isScanning, setIsScanning] = useState(true)
  const [scannedISBN, setScannedISBN] = useState('')
  const [bookData, setBookData] = useState(null)
  const [error, setError] = useState('')
  const [duplicateBook, setDuplicateBook] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animationFrameRef = useRef(null)
  const isProcessingRef = useRef(false)
  const scanStartTimeRef = useRef(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
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

  const startScanning = () => {
    setError('')
    setScannedISBN('')
    setBookData(null)
    setIsScanning(true)
  }

  // Initialize camera when isScanning becomes true
  useEffect(() => {
    if (!isScanning) return

    const initCamera = async () => {
      try {
        console.log('[Scanner] Starting camera...')
        scanStartTimeRef.current = performance.now()

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
        setError('Could not access camera. Please check permissions.')
        setIsScanning(false)
      }
    }

    initCamera()
  }, [isScanning])

  const startScanLoop = () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const scan = async () => {
      if (!isScanning || isProcessingRef.current) {
        if (isScanning && !isProcessingRef.current) {
          animationFrameRef.current = requestAnimationFrame(scan)
        }
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
          isProcessingRef.current = true

          const elapsed = performance.now() - scanStartTimeRef.current
          console.log(`[Scanner] Barcode decoded in ${elapsed.toFixed(0)}ms:`, decodedText)

          setIsLoading(true)
          setScannedISBN(decodedText)
          setIsScanning(false)
          stopCamera()
          fetchBookData(decodedText)
          return
        }
      } catch (err) {
        // Ignore decode errors, keep scanning
      }

      animationFrameRef.current = requestAnimationFrame(scan)
    }

    animationFrameRef.current = requestAnimationFrame(scan)
  }

  const fetchBookData = async (isbn) => {
    console.log('[BarcodeScannerModal] Starting fetchBookData for ISBN:', isbn)
    setIsLoading(true)
    setError('')
    setDuplicateBook(null)

    // Check for duplicate ISBN
    const existing = books.find(b => b.isbn && b.isbn === isbn)
    if (existing) {
      setDuplicateBook(existing)
      setIsLoading(false)
      return
    }

    try {
      const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
      console.log('[BarcodeScannerModal] Fetching from URL:', url)

      const response = await fetch(url)
      console.log('[BarcodeScannerModal] Response status:', response.status)

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`)
      }

      const data = await response.json()
      console.log('[BarcodeScannerModal] API response data:', data)

      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo
        const bookData = {
          title: book.title || '',
          author: book.authors?.[0] || '',
          publishYear: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
          publisher: book.publisher || '',
          pageCount: book.pageCount || null,
          coverUrl: book.imageLinks?.thumbnail || ''
        }
        console.log('[BarcodeScannerModal] Processed book data:', bookData)
        setBookData(bookData)
      } else {
        console.log('[BarcodeScannerModal] No books found in API response')
        setError('Book not found. You can add it manually.')
      }
    } catch (error) {
      console.error('[BarcodeScannerModal] Error fetching book data:', error)
      setError(`Failed to fetch book data: ${error.message}`)
    } finally {
      console.log('[BarcodeScannerModal] Finished fetchBookData, isLoading set to false')
      setIsLoading(false)
    }
  }

  const handleAddBook = () => {
    if (!bookData || !bookData.title || !bookData.author) {
      setError('Book data incomplete. Please add manually.')
      return
    }

    const newBook = {
      id: uuidv4(),
      isbn: scannedISBN,
      ...bookData,
      dateAdded: new Date().toISOString()
    }

    onAdd(newBook)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content scanner-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Scan Barcode</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="scanner-content">
          {!isScanning && !bookData && !scannedISBN && !isLoading && (
            <div className="scanner-instructions">
              <div className="scanner-icon">📷</div>
              <p>Scan the ISBN barcode on the back of your book</p>
              <button className="btn btn-primary" onClick={startScanning}>
                Start Camera
              </button>
            </div>
          )}

          {isScanning && (
            <div className="scanner-view">
              <div className="video-container">
                <video ref={videoRef} playsInline muted />
                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <div className="scan-overlay">
                  <div className="scan-frame"></div>
                </div>
              </div>
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel Scan
              </button>
            </div>
          )}

          {isLoading && (
            <div className="scanner-instructions">
              <div className="scanner-icon">⏳</div>
              <h3>Fetching book details...</h3>
              <p>ISBN: {scannedISBN}</p>
            </div>
          )}

          {scannedISBN && !isLoading && (
            <div className="scanned-result">
              {bookData && (
                <div className="book-preview">
                  <div className="preview-cover">
                    {bookData.coverUrl ? (
                      <img src={bookData.coverUrl} alt={bookData.title} />
                    ) : (
                      <div className="placeholder-cover">📖</div>
                    )}
                  </div>
                  <div className="preview-info">
                    <h3>{bookData.title}</h3>
                    <p className="preview-author">{bookData.author}</p>
                    {bookData.publishYear && (
                      <p className="preview-year">{bookData.publishYear}</p>
                    )}
                  </div>
                </div>
              )}

              {error && <div className="error-message">{error}</div>}

              {duplicateBook && (
                <div className="error-message">
                  ISBN already in library: "{duplicateBook.title}" by {duplicateBook.author}
                </div>
              )}

              {bookData && !duplicateBook && (
                <div className="scanner-actions">
                  <button className="btn btn-primary" onClick={handleAddBook}>
                    Confirm
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BarcodeScannerModal
