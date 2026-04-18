import { useState, useMemo } from 'react'
import { v4 as uuidv4 } from '../../utils/uuid'
import { fetchBookByISBN, fetchBookCoverByTitleAuthor } from '../../utils/googleBooksApi'
import { lookupBookByIsbn } from '../../utils/googleBooksClient'
import { searchBookCovers } from '../../utils/bookCoverSearch'
import { processImageFile } from '../../utils/imageProcessor'
import { uploadBookCover, deleteBookCover, isFirebaseStorageUrl } from '../../utils/firebaseStorage'
import { auth } from '../../firebase/config'
import './AddBookModal.css'

/**
 * Unified modal for adding or editing books
 * @param {Object} props
 * @param {Object} [props.book] - Book to edit (omit for add mode)
 * @param {Function} props.onClose
 * @param {Function} props.onSave - Called with book data
 * @param {Array} [props.books] - Existing books (for duplicate ISBN check in add mode)
 * @param {Array} [props.tbrLists] - TBR lists for move functionality
 * @param {Function} [props.onMoveBookBetweenLists] - Called with (bookId, fromListId, toListId)
 */
function BookFormModal({ book, onClose, onSave, books = [], tbrLists = [], onMoveBookBetweenLists }) {
  const isEditMode = Boolean(book)

  const [formData, setFormData] = useState({
    title: book?.title || '',
    author: book?.author || '',
    isbn: book?.isbn || '',
    coverUrl: book?.coverUrl || '',
    publishYear: book?.publishYear?.toString() || '',
    publisher: book?.publisher || '',
    pageCount: book?.pageCount?.toString() || ''
  })

  const [isSearching, setIsSearching] = useState(false)
  const [isbnError, setIsbnError] = useState('')
  const [uploadingCover, setUploadingCover] = useState(false)
  const [isResettingCover, setIsResettingCover] = useState(false)
  const [coverSearchResults, setCoverSearchResults] = useState([])
  const [isSearchingCovers, setIsSearchingCovers] = useState(false)
  const [showMoveTBR, setShowMoveTBR] = useState(false)

  const containingTBRLists = useMemo(() => {
    if (!isEditMode || !book) return []
    return tbrLists.filter(list => list.bookIds.includes(book.id))
  }, [isEditMode, book, tbrLists])

  const canMoveTBR = containingTBRLists.length === 1 && tbrLists.length > 1
  const currentTBRList = containingTBRLists[0]
  const otherTBRLists = tbrLists.filter(list => list.id !== currentTBRList?.id)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (name === 'isbn') setIsbnError('')
  }

  const searchByISBN = async () => {
    if (!formData.isbn) return

    setIsSearching(true)
    try {
      const bookData = await lookupBookByIsbn(formData.isbn)
      if (bookData) {
        setFormData(prev => ({
          ...prev,
          title: bookData.title || prev.title,
          author: bookData.author || prev.author,
          publishYear: bookData.publishYear?.toString() || prev.publishYear,
          publisher: bookData.publisher || prev.publisher,
          pageCount: bookData.pageCount?.toString() || prev.pageCount,
          coverUrl: bookData.coverUrl || prev.coverUrl
        }))
      } else {
        alert('No book found with that ISBN')
      }
    } catch (error) {
      console.error('Error fetching book data:', error)
      alert('Failed to fetch book data')
    } finally {
      setIsSearching(false)
    }
  }

  const resetCoverFromISBN = async () => {
    setIsResettingCover(true)
    try {
      let coverUrl = ''
      
      if (formData.isbn) {
        // Primary: ISBN search
        const bookData = await fetchBookByISBN(formData.isbn)
        coverUrl = bookData?.coverUrl || ''
      } else if (formData.title && formData.author) {
        // Fallback: title + author search
        coverUrl = await fetchBookCoverByTitleAuthor(formData.title, formData.author)
      }
      
      if (coverUrl) {
        setFormData(prev => ({ ...prev, coverUrl }))
      } else {
        alert('No cover image found')
      }
    } catch (error) {
      console.error('Error resetting cover:', error)
      alert('Failed to fetch cover image')
    } finally {
      setIsResettingCover(false)
    }
  }

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const user = auth.currentUser
    if (!user) {
      alert('You must be logged in to upload images')
      return
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image too large. Maximum size is 5MB')
      return
    }

    setUploadingCover(true)
    try {
      // Process image (resize & compress)
      const processedBlob = await processImageFile(file)

      // Upload to Firebase Storage
      const bookId = isEditMode ? book.id : uuidv4()
      const downloadURL = await uploadBookCover(user, bookId, processedBlob)

      // Update form data with new URL
      setFormData(prev => ({ ...prev, coverUrl: downloadURL }))
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploadingCover(false)
    }
  }

  const handleClearCover = async () => {
    const user = auth.currentUser
    if (!user) return

    // If it's a Firebase Storage URL, delete from storage
    if (isEditMode && formData.coverUrl && isFirebaseStorageUrl(formData.coverUrl)) {
      try {
        await deleteBookCover(user, book.id)
      } catch (error) {
        console.error('Error deleting cover:', error)
      }
    }

    setFormData(prev => ({ ...prev, coverUrl: '' }))
    setCoverSearchResults([])
  }

  const handleSearchCovers = async () => {
    if (!formData.title && !formData.author) {
      alert('Please enter at least a title or author to search for covers')
      return
    }

    setIsSearchingCovers(true)
    setCoverSearchResults([])

    try {
      const covers = await searchBookCovers(formData.title, formData.author)
      if (covers.length === 0) {
        alert('No cover images found for this book')
      } else {
        setCoverSearchResults(covers)
      }
    } catch (error) {
      console.error('Error searching covers:', error)
      alert(error.message || 'Failed to search for covers')
    } finally {
      setIsSearchingCovers(false)
    }
  }

  const handleSelectCover = (coverUrl) => {
    setFormData(prev => ({ ...prev, coverUrl }))
    setCoverSearchResults([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.title || !formData.author) {
      alert('Title and Author are required')
      return
    }

    // Check for duplicate ISBN (only in add mode)
    if (!isEditMode && formData.isbn) {
      const existingBook = books.find(b => b.isbn && b.isbn === formData.isbn)
      if (existingBook) {
        setIsbnError(`ISBN already exists: "${existingBook.title}" by ${existingBook.author}`)
        return
      }
    }

    const savedBook = {
      ...(isEditMode ? book : {}),
      id: isEditMode ? book.id : uuidv4(),
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      coverUrl: formData.coverUrl,
      publishYear: formData.publishYear ? parseInt(formData.publishYear) : null,
      publisher: formData.publisher,
      pageCount: formData.pageCount ? parseInt(formData.pageCount) : null,
      ...(isEditMode ? {} : { dateAdded: new Date().toISOString() })
    }

    onSave(savedBook)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? 'Edit Book' : 'Add Book'}</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="book-form">
          <div className="form-group">
            <label htmlFor="isbn">ISBN</label>
            {isEditMode ? (
              <input
                type="text"
                id="isbn"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="9780743273565"
              />
            ) : (
              <div className="isbn-input-group">
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange}
                  placeholder="9780743273565"
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={searchByISBN}
                  disabled={!formData.isbn || isSearching}
                >
                  {isSearching ? 'Searching...' : 'Auto-fill'}
                </button>
              </div>
            )}
            {!isEditMode && <small className="form-hint">Enter ISBN and click Auto-fill to fetch book details</small>}
            {isbnError && <div className="form-error">{isbnError}</div>}
          </div>

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="author">Author *</label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="publishYear">Year</label>
              <input
                type="number"
                id="publishYear"
                name="publishYear"
                value={formData.publishYear}
                onChange={handleChange}
                placeholder="2020"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pageCount">Pages</label>
              <input
                type="number"
                id="pageCount"
                name="pageCount"
                value={formData.pageCount}
                onChange={handleChange}
                placeholder="300"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="publisher">Publisher</label>
            <input
              type="text"
              id="publisher"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Cover Image</label>

            {formData.coverUrl && (
              <div className="cover-preview">
                <img src={formData.coverUrl} alt="Book cover preview" />
              </div>
            )}

            <div className="cover-actions">
              <label className="btn btn-secondary photo-upload-btn">
                {uploadingCover ? 'Uploading...' : 'Choose Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploadingCover}
                  style={{ display: 'none' }}
                />
              </label>

              {formData.coverUrl && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClearCover}
                  disabled={uploadingCover || isResettingCover || isSearchingCovers}
                >
                  Clear Cover
                </button>
              )}

              {isEditMode && (formData.isbn || (formData.title && formData.author)) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetCoverFromISBN}
                  disabled={uploadingCover || isResettingCover || isSearchingCovers}
                >
                  {isResettingCover ? 'Resetting...' : 'Reset Image'}
                </button>
              )}

              {(formData.title || formData.author) && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleSearchCovers}
                  disabled={uploadingCover || isResettingCover || isSearchingCovers}
                >
                  {isSearchingCovers ? 'Searching...' : 'Find Online'}
                </button>
              )}
            </div>

            {coverSearchResults.length > 0 && (
              <div className="cover-search-results">
                <p className="cover-search-hint">Click an image to use it:</p>
                <div className="cover-search-grid">
                  {coverSearchResults.map((cover, index) => (
                    <button
                      key={index}
                      type="button"
                      className="cover-search-option"
                      onClick={() => handleSelectCover(cover.url)}
                      title={cover.source}
                    >
                      <img src={cover.url} alt={`Cover option ${index + 1}`} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <input
              type="url"
              id="coverUrl"
              name="coverUrl"
              value={formData.coverUrl}
              onChange={handleChange}
              placeholder="Or paste URL..."
              className="cover-url-input"
            />
            <small className="form-hint">Upload a photo or paste an image URL</small>
          </div>

          {canMoveTBR && (
            <div className="form-group move-tbr-section">
              <label>TBR List</label>
              {!showMoveTBR ? (
                <div className="move-tbr-current">
                  <span className="move-tbr-badge">{currentTBRList.name}</span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowMoveTBR(true)}
                  >
                    Move to TBR
                  </button>
                </div>
              ) : (
                <div className="move-tbr-options">
                  <p className="move-tbr-prompt">
                    Move from "{currentTBRList.name}" to:
                  </p>
                  <div className="move-tbr-list">
                    {otherTBRLists.map(list => (
                      <button
                        key={list.id}
                        type="button"
                        className="move-tbr-option"
                        onClick={() => {
                          const confirmed = window.confirm(
                            `Move "${book.title}" from "${currentTBRList.name}" to "${list.name}"?`
                          )
                          if (confirmed && onMoveBookBetweenLists) {
                            onMoveBookBetweenLists(book.id, currentTBRList.id, list.id)
                            setShowMoveTBR(false)
                          }
                        }}
                      >
                        {list.name}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowMoveTBR(false)}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isEditMode ? 'Save Changes' : 'Add Book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default BookFormModal
