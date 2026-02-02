import React, { useRef, useMemo, useState, useCallback } from 'react'
import BookCard from './BookCard'
import { sortAuthors, getAvailableLetters, findAuthorForLetter } from '../utils/sortBooks'
import './BookList.css'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#'.split('')

function BookList({ books, onBookClick, totalBooks, totalAuthors }) {
  const listRef = useRef(null)
  const authorRefs = useRef({})
  const [activeIndex, setActiveIndex] = useState(null)

  // Group books by author
  const booksByAuthor = books.reduce((acc, book) => {
    const author = book.author || 'Unknown Author'
    if (!acc[author]) {
      acc[author] = []
    }
    acc[author].push(book)
    return acc
  }, {})

  // Helper to extract last name from author string
  const getLastName = (author) => {
    const parts = author.trim().split(/\s+/)
    return parts.length > 1 ? parts[1] : parts[0]
  }

  // Sort authors by last name
  const sortedAuthors = sortAuthors(Object.keys(booksByAuthor))

  // Get available letters from authors' last names
  const availableLetters = useMemo(() => {
    return getAvailableLetters(sortedAuthors)
  }, [sortedAuthors])

  // Find author by last name initial
  const findAuthorForLetterCallback = useCallback((letter) => {
    return findAuthorForLetter(letter, sortedAuthors)
  }, [sortedAuthors])

  // Handle scroll to letter
  const scrollToLetter = useCallback((letter) => {
    const author = findAuthorForLetterCallback(letter)
    if (author && authorRefs.current[author]) {
      authorRefs.current[author].scrollIntoView({ behavior: 'auto', block: 'start' })
    }
  }, [findAuthorForLetterCallback])

  // Handle touch/mouse on alphabet bar
  const handleAlphabetInteraction = useCallback((e) => {
    e.preventDefault()
    const target = e.target.closest('.alphabet-letter')
    if (target) {
      const letter = target.dataset.letter
      const idx = ALPHABET.indexOf(letter)
      setActiveIndex(idx)
      scrollToLetter(letter)
    }
  }, [scrollToLetter])

  const handleTouchMove = useCallback((e) => {
    e.preventDefault()
    const touch = e.touches[0]
    const element = document.elementFromPoint(touch.clientX, touch.clientY)
    if (element?.classList.contains('alphabet-letter')) {
      const letter = element.dataset.letter
      const idx = ALPHABET.indexOf(letter)
      setActiveIndex(idx)
      scrollToLetter(letter)
    }
  }, [scrollToLetter])

  const handleInteractionEnd = useCallback(() => {
    setActiveIndex(null)
  }, [])

  return (
    <div className="book-list-container">
      <div className="list-stats">
        <span>{totalBooks} books</span>
        <span className="list-stats-separator">·</span>
        <span>{totalAuthors} authors</span>
      </div>
      <div className="book-list" ref={listRef}>
        {sortedAuthors.map((author) => (
          <React.Fragment key={author}>
            <div
              className="author-divider"
              ref={el => authorRefs.current[author] = el}
            >
              <span className="author-divider-name">{author}</span>
            </div>
            {booksByAuthor[author].map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onClick={onBookClick}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      {sortedAuthors.length > 0 && (
        <div
          className="alphabet-bar"
          onMouseDown={handleAlphabetInteraction}
          onMouseMove={(e) => e.buttons === 1 && handleAlphabetInteraction(e)}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
          onTouchStart={handleAlphabetInteraction}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleInteractionEnd}
        >
          {ALPHABET.map((letter, idx) => (
            <span
              key={letter}
              data-letter={letter}
              className={`alphabet-letter ${availableLetters.has(letter) ? 'active' : ''} ${activeIndex === idx ? 'touching' : ''}`}
            >
              {letter}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default BookList
