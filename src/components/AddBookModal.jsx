import { useState } from 'react'
import { v4 as uuidv4 } from '../utils/uuid'
import './AddBookModal.css'

function AddBookModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    coverUrl: '',
    publishYear: '',
    publisher: '',
    pageCount: ''
  })

  const [isSearching, setIsSearching] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const searchByISBN = async () => {
    if (!formData.isbn) return

    setIsSearching(true)
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${formData.isbn}`
      )
      const data = await response.json()

      if (data.items && data.items.length > 0) {
        const book = data.items[0].volumeInfo
        setFormData(prev => ({
          ...prev,
          title: book.title || prev.title,
          author: book.authors?.[0] || prev.author,
          publishYear: book.publishedDate ? new Date(book.publishedDate).getFullYear().toString() : prev.publishYear,
          publisher: book.publisher || prev.publisher,
          pageCount: book.pageCount?.toString() || prev.pageCount,
          coverUrl: book.imageLinks?.thumbnail || prev.coverUrl
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

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.title || !formData.author) {
      alert('Title and Author are required')
      return
    }

    const newBook = {
      id: uuidv4(),
      title: formData.title,
      author: formData.author,
      isbn: formData.isbn,
      coverUrl: formData.coverUrl,
      publishYear: formData.publishYear ? parseInt(formData.publishYear) : null,
      publisher: formData.publisher,
      pageCount: formData.pageCount ? parseInt(formData.pageCount) : null,
      dateAdded: new Date().toISOString()
    }

    onAdd(newBook)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Book</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="book-form">
          <div className="form-group">
            <label htmlFor="isbn">ISBN</label>
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
            <small className="form-hint">Enter ISBN and click Auto-fill to fetch book details</small>
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
            <label htmlFor="coverUrl">Cover Image URL</label>
            <input
              type="url"
              id="coverUrl"
              name="coverUrl"
              value={formData.coverUrl}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Add Book
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBookModal
