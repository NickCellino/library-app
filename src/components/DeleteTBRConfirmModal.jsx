import './DeleteTBRConfirmModal.css'

function DeleteTBRConfirmModal({ isOpen, onClose, onConfirm, tbrList, books }) {
  if (!isOpen || !tbrList) return null

  const tbrListBooks = books.filter(book => tbrList.bookIds.includes(book.id))

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div className="delete-tbr-overlay" onClick={handleBackdropClick}>
      <div className="delete-tbr-modal">
        <h2 className="delete-tbr-title">Delete TBR List?</h2>
        
        <div className="delete-tbr-content">
          <p className="delete-tbr-message">
            Are you sure you want to delete <strong>"{tbrList.name}"</strong>?
          </p>

          {tbrListBooks.length > 0 && (
            <>
              <p className="delete-tbr-subtitle">This TBR list contains:</p>
              <ul className="delete-tbr-books">
                {tbrListBooks.slice(0, 5).map(book => (
                  <li key={book.id}>{book.title}</li>
                ))}
                {tbrListBooks.length > 5 && (
                  <li className="delete-tbr-more">
                    and {tbrListBooks.length - 5} more...
                  </li>
                )}
              </ul>
            </>
          )}

          {tbrListBooks.length === 0 && (
            <p className="delete-tbr-empty">This TBR list is empty.</p>
          )}
        </div>

        <div className="delete-tbr-actions">
          <button className="delete-tbr-btn delete-tbr-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="delete-tbr-btn delete-tbr-btn-confirm" onClick={handleConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeleteTBRConfirmModal
