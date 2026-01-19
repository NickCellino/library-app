import './BookCard.css'

function BookCard({ book, onEdit, onDelete }) {
  const metaParts = []
  if (book.author) metaParts.push(book.author)
  if (book.pageCount) metaParts.push(`${book.pageCount} pp`)
  if (book.publishYear) metaParts.push(book.publishYear)

  return (
    <div className="book-row">
      <div className="book-row-cover">
        {book.coverUrl ? (
          <img src={book.coverUrl} alt={`Cover of ${book.title}`} />
        ) : (
          <div className="book-row-cover-placeholder">
            <span className="book-icon">📖</span>
          </div>
        )}
      </div>

      <div className="book-row-info">
        <span className="book-row-title">{book.title}</span>
        {metaParts.length > 0 && (
          <span className="book-row-meta">{metaParts.join(' · ')}</span>
        )}
      </div>

      <div className="book-row-actions">
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
  )
}

export default BookCard
