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
        <span className="book-row-author">{book.author}</span>
        {metaParts.length > 0 && (
          <span className="book-row-meta">{metaParts.join(' · ')}</span>
        )}
      </div>
    </div>
  )
}

export default BookCard
