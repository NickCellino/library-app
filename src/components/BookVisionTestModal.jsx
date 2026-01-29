import { useState, useEffect, useRef } from 'react'
import { recognizeBookCover } from '../utils/coverRecognition'
import './BookVisionTestModal.css'

function BookVisionTestModal({ onClose }) {
  const [isCapturing, setIsCapturing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)

  // Start camera on mount
  useEffect(() => {
    startCamera()
    return () => stopCamera()
  }, [])

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
        }
      }
    } catch (err) {
      console.error('Camera error:', err)
      setError('Could not access camera: ' + err.message)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const captureAndProcess = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    setIsCapturing(true)
    setError(null)
    setResults(null)

    // Capture frame to canvas
    const ctx = canvas.getContext('2d')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    // Get base64 image
    const base64Image = canvas.toDataURL('image/jpeg', 0.8)

    setIsCapturing(false)
    setIsProcessing(true)

    try {
      const result = await recognizeBookCover(base64Image)
      setResults(result)
    } catch (err) {
      console.error('Vision API error:', err)
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    setResults(null)
    setError(null)
    startCamera()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content vision-test-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Test Book Vision</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="vision-test-content">
          {/* Camera section - show when not processing and no results */}
          {!isProcessing && !results && (
            <div className="vision-camera-section">
              <div className="vision-video-container">
                <video ref={videoRef} playsInline muted />
                <canvas ref={canvasRef} />
              </div>
              <button
                className="btn btn-primary vision-capture-btn"
                onClick={captureAndProcess}
                disabled={isCapturing}
              >
                {isCapturing ? 'Capturing...' : 'Capture'}
              </button>
            </div>
          )}

          {/* Processing state */}
          {isProcessing && (
            <div className="vision-loading">
              <div className="vision-loading-spinner" />
              <span>Processing with Cloud Vision...</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="vision-error">
              {error}
            </div>
          )}

          {/* Results */}
          {results && (
            <div className="vision-results">
              {/* Raw OCR Text */}
              <div className="vision-section">
                <h3 className="vision-section-title">Raw OCR Text</h3>
                <div className="vision-raw-text">{results.rawText || ''}</div>
              </div>

              {/* Parsed Candidates */}
              <div className="vision-section">
                <h3 className="vision-section-title">Parsed Candidates</h3>
                <div className="vision-candidates">
                  {(results.candidates?.titleCandidates?.length > 0 ||
                    results.candidates?.authorCandidates?.length > 0) ? (
                    <>
                      {results.candidates.titleCandidates?.length > 0 && (
                        <div className="vision-candidate-group">
                          <span className="vision-candidate-label">Titles</span>
                          <div className="vision-candidate-list">
                            {results.candidates.titleCandidates.map((title, i) => (
                              <span key={i} className="vision-candidate-tag">{title}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {results.candidates.authorCandidates?.length > 0 && (
                        <div className="vision-candidate-group">
                          <span className="vision-candidate-label">Authors</span>
                          <div className="vision-candidate-list">
                            {results.candidates.authorCandidates.map((author, i) => (
                              <span key={i} className="vision-candidate-tag author">{author}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="vision-no-candidates">No candidates parsed</span>
                  )}
                </div>
              </div>

              {/* Search Queries */}
              {results.searchQueries?.length > 0 && (
                <div className="vision-section">
                  <h3 className="vision-section-title">Search Queries</h3>
                  <div className="vision-queries">
                    {results.searchQueries.map((query, i) => (
                      <span key={i} className="vision-query-tag">{query}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Book Matches */}
              <div className="vision-section">
                <h3 className="vision-section-title">Book Matches</h3>
                {results.books?.length > 0 ? (
                  <div className="vision-books">
                    {results.books.map((book, i) => (
                      <div key={i} className="vision-book-card">
                        <div className="vision-book-cover">
                          {book.coverUrl ? (
                            <img src={book.coverUrl} alt="" />
                          ) : (
                            <div className="vision-book-cover-placeholder">📖</div>
                          )}
                        </div>
                        <div className="vision-book-info">
                          <h4 className="vision-book-title">{book.title}</h4>
                          {book.author && <p className="vision-book-author">{book.author}</p>}
                          <p className="vision-book-meta">
                            {[book.publishYear, book.publisher].filter(Boolean).join(' • ')}
                            {book.isbn && ` • ISBN: ${book.isbn}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="vision-no-books">No books found</div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="vision-footer">
          {results && (
            <button className="btn btn-secondary" onClick={handleRetry}>
              Try Again
            </button>
          )}
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookVisionTestModal
