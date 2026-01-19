import './BookDetailModal.css'

function BookDetailModal({ book, onClose, onEdit, onDelete }) {
  if (!book) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleDelete = () => {
    if (window.confirm('Delete this book?')) {
      onDelete(book.id)
      onClose()
    }
  }

  return (
    <div className="detail-overlay" onClick={handleBackdropClick}>
      <div className="detail-modal">
        <button className="detail-close" onClick={onClose}>×</button>

        <div className="detail-content">
          <div className="detail-cover">
            {book.coverUrl ? (
              <img src={book.coverUrl} alt={`Cover of ${book.title}`} />
            ) : (
              <div className="detail-cover-placeholder">
                <span>📖</span>
              </div>
            )}
          </div>

          <div className="detail-info">
            <h2 className="detail-title">{book.title}</h2>
            {book.author && <p className="detail-author">{book.author}</p>}

            <div className="detail-meta">
              {book.publishYear && <span>{book.publishYear}</span>}
              {book.publisher && <span>{book.publisher}</span>}
              {book.pageCount && <span>{book.pageCount} pages</span>}
              {book.isbn && <span className="detail-isbn">ISBN: {book.isbn}</span>}
            </div>
          </div>
        </div>

        <div className="detail-actions">
          <button className="detail-btn detail-btn-edit" onClick={() => { onEdit(book); onClose() }}>
            Edit
          </button>
          <button className="detail-btn detail-btn-delete" onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookDetailModal
