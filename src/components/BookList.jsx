import BookCard from './BookCard'
import './BookList.css'

function BookList({ books, onEdit, onDelete }) {
  // Group books by author
  const booksByAuthor = books.reduce((acc, book) => {
    const author = book.author || 'Unknown Author'
    if (!acc[author]) {
      acc[author] = []
    }
    acc[author].push(book)
    return acc
  }, {})

  // Sort authors alphabetically
  const sortedAuthors = Object.keys(booksByAuthor).sort()

  return (
    <div className="book-list">
      {sortedAuthors.map((author) => (
        <div key={author} className="author-group">
          <div className="author-header">
            <h2 className="author-name">{author}</h2>
            <span className="author-count">
              {booksByAuthor[author].length} {booksByAuthor[author].length === 1 ? 'book' : 'books'}
            </span>
          </div>

          <div className="author-books">
            {booksByAuthor[author].map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default BookList
