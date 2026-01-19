import './BookCard.css'

function BookCard({ book, onClick }) {
  const metaParts = []
  if (book.pageCount) metaParts.push(`${book.pageCount} pp`)
  if (book.publishYear) metaParts.push(book.publishYear)

  return (
    <div className="book-row" onClick={() => onClick(book)}>
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

      <span className="book-row-chevron">›</span>
    </div>
  )
}

export default BookCard
