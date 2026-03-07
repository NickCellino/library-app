import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BookList from '../components/BookList'

describe('BookList', () => {
  const mockBooks = [
    { id: '1', title: 'Book A', author: 'Jane Austen' },
    { id: '2', title: 'Book B', author: 'Jane Austen' },
    { id: '3', title: 'Book C', author: 'George Orwell' },
  ]

  const mockOnBookClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('stats display', () => {
    it('displays book count in stats', () => {
      render(<BookList books={mockBooks} onBookClick={mockOnBookClick} />)
      expect(screen.getByText(/books$/)).toBeInTheDocument()
    })

    it('displays author count in stats', () => {
      render(<BookList books={mockBooks} onBookClick={mockOnBookClick} />)
      expect(screen.getByText(/authors$/)).toBeInTheDocument()
    })

    it('accepts custom totals', () => {
      render(
        <BookList 
          books={mockBooks} 
          onBookClick={mockOnBookClick}
          totalBooks={10}
          totalAuthors={5}
        />
      )
      expect(screen.getByText(/10 books/)).toBeInTheDocument()
      expect(screen.getByText(/5 authors/)).toBeInTheDocument()
    })

    it('handles empty book list', () => {
      render(<BookList books={[]} onBookClick={mockOnBookClick} totalBooks={0} totalAuthors={0} />)
      expect(screen.getByText(/books/)).toBeInTheDocument()
      expect(screen.getByText(/authors/)).toBeInTheDocument()
    })
  })

  describe('grouping', () => {
    it('groups books by author', () => {
      render(<BookList books={mockBooks} onBookClick={mockOnBookClick} />)
      expect(screen.getAllByText('Jane Austen').length).toBeGreaterThan(0)
      expect(screen.getAllByText('George Orwell').length).toBeGreaterThan(0)
    })

    it('displays multiple books under same author', () => {
      render(<BookList books={mockBooks} onBookClick={mockOnBookClick} />)
      const janeAustenDivider = screen.getAllByText('Jane Austen')
      expect(janeAustenDivider.length).toBeGreaterThan(0)
    })

    it('handles unknown author', () => {
      const booksWithUnknown = [
        { id: '1', title: 'Anonymous Book' }
      ]
      render(<BookList books={booksWithUnknown} onBookClick={mockOnBookClick} />)
      expect(screen.getByText('Unknown Author')).toBeInTheDocument()
    })
  })

  describe('alphabet bar', () => {
    it('shows alphabet bar when books exist', () => {
      render(<BookList books={mockBooks} onBookClick={mockOnBookClick} />)
      expect(document.querySelector('.alphabet-bar')).toBeInTheDocument()
    })

    it('hides alphabet bar when no books', () => {
      render(<BookList books={[]} onBookClick={mockOnBookClick} />)
      expect(document.querySelector('.alphabet-bar')).not.toBeInTheDocument()
    })

    it('marks available letters as active', () => {
      render(<BookList books={mockBooks} onBookClick={mockOnBookClick} />)
      const aLetter = document.querySelector('[data-letter="A"]')
      expect(aLetter).toHaveClass('active')
    })
  })

  describe('book cards', () => {
    it('renders all books', () => {
      render(<BookList books={mockBooks} onBookClick={mockOnBookClick} />)
      expect(screen.getByText('Book A')).toBeInTheDocument()
      expect(screen.getByText('Book B')).toBeInTheDocument()
      expect(screen.getByText('Book C')).toBeInTheDocument()
    })

    it('passes showRemove prop to BookCard', () => {
      const mockOnRemove = vi.fn()
      render(
        <BookList 
          books={mockBooks} 
          onBookClick={mockOnBookClick}
          showRemove={true}
          onRemove={mockOnRemove}
        />
      )
      const removeButtons = document.querySelectorAll('.book-row-remove')
      expect(removeButtons).toHaveLength(3)
    })

    it('does not show remove buttons when showRemove is false', () => {
      const mockOnRemove = vi.fn()
      render(
        <BookList 
          books={mockBooks} 
          onBookClick={mockOnBookClick}
          showRemove={false}
          onRemove={mockOnRemove}
        />
      )
      expect(document.querySelector('.book-row-remove')).not.toBeInTheDocument()
    })
  })
})
