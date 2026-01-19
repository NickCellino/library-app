import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { v4 as uuidv4 } from '../utils/uuid'
import './BarcodeScannerModal.css'

function BarcodeScannerModal({ onClose, onAdd }) {
  const [isScanning, setIsScanning] = useState(false)
  const [scannedISBN, setScannedISBN] = useState('')
  const [bookData, setBookData] = useState(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scannerRef = useRef(null)
  const html5QrCodeRef = useRef(null)
  const isProcessingRef = useRef(false)
  const isScannerStoppedRef = useRef(true)

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current && !isScannerStoppedRef.current) {
        isScannerStoppedRef.current = true
        html5QrCodeRef.current.stop().catch(console.error)
      }
    }
  }, [isScanning])

  const startScanning = () => {
    setError('')
    setScannedISBN('')
    setBookData(null)
    setIsScanning(true)
  }

  // Initialize scanner when isScanning becomes true
  useEffect(() => {
    if (!isScanning) return

    const initScanner = async () => {
      // Wait for DOM to update
      await new Promise(resolve => setTimeout(resolve, 100))

      try {
        html5QrCodeRef.current = new Html5Qrcode('barcode-scanner')
        isScannerStoppedRef.current = false

        await html5QrCodeRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 }
          },
          async (decodedText) => {
            // Prevent multiple callbacks from processing
            if (isProcessingRef.current) return
            isProcessingRef.current = true

            console.log('[BarcodeScannerModal] Barcode decoded:', decodedText)

            // Set loading state immediately to prevent white screen
            setIsLoading(true)
            setScannedISBN(decodedText)

            // Stop scanning after successful decode
            if (!isScannerStoppedRef.current) {
              isScannerStoppedRef.current = true
              try {
                await html5QrCodeRef.current.stop()
                console.log('[BarcodeScannerModal] Scanner stopped successfully')
              } catch (err) {
                console.error('[BarcodeScannerModal] Error stopping scanner:', err)
              }
            }

            setIsScanning(false)

            // Fetch book data (fetchBookData will manage isLoading state)
            fetchBookData(decodedText)
          },
          (errorMessage) => {
            // Ignore decoding errors (happens frequently during scanning)
          }
        )
      } catch (err) {
        console.error('Error starting scanner:', err)
        setError('Could not access camera. Please check permissions.')
        setIsScanning(false)
      }
    }

    initScanner()
  }, [isScanning])

  const stopScanning = async () => {
    if (html5QrCodeRef.current && !isScannerStoppedRef.current) {
      isScannerStoppedRef.current = true
      try {
        await html5QrCodeRef.current.stop()
        setIsScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }

  const fetchBookData = async (isbn) => {
    console.log('[BarcodeScannerModal] Starting fetchBookData for ISBN:', isbn)
    setIsLoading(true)
    setError('')

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
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const testISBN = '9780743273565' // The Great Gatsby
                  console.log('[BarcodeScannerModal] Testing with ISBN:', testISBN)
                  setScannedISBN(testISBN)
                  fetchBookData(testISBN)
                }}
                style={{ marginTop: '8px' }}
              >
                Test with Sample ISBN
              </button>
            </div>
          )}

          {isScanning && (
            <div className="scanner-view">
              <div id="barcode-scanner"></div>
              <button className="btn btn-secondary" onClick={stopScanning}>
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
              <div className="result-header">
                <span className="success-icon">✓</span>
                <span>ISBN: {scannedISBN}</span>
              </div>

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

              <div className="scanner-actions">
                {bookData && (
                  <button className="btn btn-primary" onClick={handleAddBook}>
                    Add to Library
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => {
                  setScannedISBN('')
                  setBookData(null)
                  setError('')
                  setIsLoading(false)
                  isProcessingRef.current = false
                  isScannerStoppedRef.current = true
                }}>
                  Scan Another
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BarcodeScannerModal
