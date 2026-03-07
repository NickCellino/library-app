import './DeleteListConfirmModal.css'

function DeleteListConfirmModal({ isOpen, onClose, onConfirm, list, books }) {
  if (!isOpen || !list) return null

  const listBooks = books.filter(book => list.bookIds.includes(book.id))

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="delete-list-overlay" onClick={handleBackdropClick}>
      <div className="delete-list-modal">
        <h2 className="delete-list-title">Delete List?</h2>
        
        <div className="delete-list-content">
          <p className="delete-list-message">
            Are you sure you want to delete <strong>"{list.name}"</strong>?
          </p>

          {listBooks.length > 0 && (
            <>
              <p className="delete-list-subtitle">This list contains:</p>
              <ul className="delete-list-books">
                {listBooks.slice(0, 5).map(book => (
                  <li key={book.id}>{book.title}</li>
                ))}
                {listBooks.length > 5 && (
                  <li className="delete-list-more">
                    and {listBooks.length - 5} more...
                  </li>
                )}
              </ul>
            </>
          )}

          {listBooks.length === 0 && (
            <p className="delete-list-empty">This list is empty.</p>
          )}
        </div>

        <div className="delete-list-actions">
          <button className="delete-list-btn delete-list-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-list-btn delete-list-btn-confirm" onClick={handleConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteListConfirmModal
