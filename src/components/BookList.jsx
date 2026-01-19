import React from 'react'
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
        <React.Fragment key={author}>
          <div className="author-divider">
            <span className="author-divider-name">{author}</span>
          </div>
          {booksByAuthor[author].map((book) => (
            <BookCard
              key={book.id}
              book={book}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  )
}

export default BookList
