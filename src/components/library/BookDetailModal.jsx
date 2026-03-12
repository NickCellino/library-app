import './BookDetailModal.css'

function BookDetailModal({ book, onClose, onEdit, onDelete, tbrLists = [], onOpenTBRList, showDelete = true, onRemoveFromList }) {
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

  const handleRemoveFromList = () => {
    if (window.confirm('Remove this book from the list?')) {
      onRemoveFromList(book.id)
      onClose()
    }
  }

  const containingTBRLists = tbrLists.filter(tbrList => tbrList.bookIds.includes(book.id))

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

            {containingTBRLists.length > 0 && (
              <div className="list-badges">
                <span className="badge-label">In TBR:</span>
                {containingTBRLists.map(tbrList => (
                  <span 
                    key={tbrList.id} 
                    className="list-badge"
                    onClick={() => onOpenTBRList && onOpenTBRList(tbrList)}
                  >
                    {tbrList.name}
                  </span>
                ))}
              </div>
            )}

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
          {showDelete ? (
            <button className="detail-btn detail-btn-delete" onClick={handleDelete}>
              Delete
            </button>
          ) : onRemoveFromList ? (
            <button className="detail-btn detail-btn-delete" onClick={handleRemoveFromList}>
              Remove from List
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default BookDetailModal
