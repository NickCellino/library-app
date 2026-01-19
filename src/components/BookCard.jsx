import './BookCard.css'

function BookCard({ book, onEdit, onDelete }) {
  return (
    <div className="book-card">
      <div className="book-cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={`Cover of ${book.title}`} />
        ) : (
          <div className="book-cover-placeholder">
            <span className="book-icon">📖</span>
          </div>
        )}
      </div>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>

        {book.publishYear && (
          <div className="book-meta">
            <span className="book-year">{book.publishYear}</span>
          </div>
        )}

        {book.isbn && (
          <div className="book-isbn">ISBN: {book.isbn}</div>
        )}

        <div className="book-actions">
          <button
            className="btn-icon"
            onClick={() => onEdit(book)}
            title="Edit book"
          >
            ✏️
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(book.id)}
            title="Delete book"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookCard
