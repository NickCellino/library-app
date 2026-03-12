import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookDetailModal from '../components/BookDetailModal'

describe('BookDetailModal', () => {
  const mockBook = {
    id: '123',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    publishYear: 1925,
    publisher: 'Scribner',
    pageCount: 180,
    coverUrl: 'https://example.com/cover.jpg'
  }

  const mockOnClose = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when no book provided', () => {
    const { container } = render(<BookDetailModal book={null} onClose={mockOnClose} />)
    expect(container.firstChild).toBeNull()
  })

  it('displays book title', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
  })

  it('displays book author', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
    expect(screen.getByText(mockBook.author)).toBeInTheDocument()
  })

  it('handles book without author', () => {
    const bookWithoutAuthor = { ...mockBook, author: null }
    render(<BookDetailModal book={bookWithoutAuthor} onClose={mockOnClose} />)
    expect(screen.getByText(mockBook.title)).toBeInTheDocument()
    expect(screen.queryByText(mockBook.author)).not.toBeInTheDocument()
  })

  it('displays book cover image', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
    const img = screen.getByAltText('Cover of The Great Gatsby')
    expect(img).toBeInTheDocument()
    expect(img.src).toBe('https://example.com/cover.jpg')
  })

  it('displays placeholder when no cover', () => {
    const bookWithoutCover = { ...mockBook, coverUrl: null }
    render(<BookDetailModal book={bookWithoutCover} onClose={mockOnClose} />)
    expect(screen.getByText('📖')).toBeInTheDocument()
  })

  it('displays publish year', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
    expect(screen.getByText(mockBook.publishYear.toString())).toBeInTheDocument()
  })

  it('displays publisher', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
    expect(screen.getByText(mockBook.publisher)).toBeInTheDocument()
  })

  it('displays page count', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
    expect(screen.getByText(`${mockBook.pageCount} pages`)).toBeInTheDocument()
  })

  it('displays ISBN', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
    expect(screen.getByText(`ISBN: ${mockBook.isbn}`)).toBeInTheDocument()
  })

  it('has edit button', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} onEdit={mockOnEdit} />)
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
  })

  it('has delete button', () => {
    render(<BookDetailModal book={mockBook} onClose={mockOnClose} onDelete={mockOnDelete} />)
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  describe('button actions', () => {
    it('calls onEdit with book when edit clicked', () => {
      render(
        <BookDetailModal 
          book={mockBook} 
          onClose={mockOnClose} 
          onEdit={mockOnEdit} 
          onDelete={mockOnDelete} 
        />
      )
      
      fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockBook)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('calls onDelete with book id when delete confirmed', () => {
      vi.stubGlobal('confirm', vi.fn(() => true))
      render(
        <BookDetailModal
          book={mockBook}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      expect(mockOnDelete).toHaveBeenCalledWith(mockBook.id)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('does not delete when user cancels confirmation', () => {
      vi.stubGlobal('confirm', vi.fn(() => false))
      render(
        <BookDetailModal
          book={mockBook}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
          onDelete={mockOnDelete}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

      expect(mockOnDelete).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('closing', () => {
    it('calls onClose when close button clicked', () => {
      render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
      
      fireEvent.click(screen.getByRole('button', { name: /×/ }))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when backdrop clicked', () => {
      const { container } = render(<BookDetailModal book={mockBook} onClose={mockOnClose} />)
      
      fireEvent.click(container.querySelector('.detail-overlay'))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('TBR lists', () => {
    it('displays TBR lists containing the book', () => {
      const tbrLists = [
        { id: 'list1', name: 'Favorites', bookIds: ['123'] },
        { id: 'list2', name: 'Read', bookIds: ['123', '456'] }
      ]
      
      render(
        <BookDetailModal
          book={mockBook}
          onClose={mockOnClose}
          tbrLists={tbrLists}
        />
      )

      expect(screen.getByText('Favorites')).toBeInTheDocument()
      expect(screen.getByText('Read')).toBeInTheDocument()
    })

    it('does not show TBR list section when book not in any TBR list', () => {
      const tbrLists = [
        { id: 'list1', name: 'Favorites', bookIds: ['other-book'] }
      ]

      render(
        <BookDetailModal
          book={mockBook}
          onClose={mockOnClose}
          tbrLists={tbrLists}
        />
      )

      expect(screen.queryByText('In TBR:')).not.toBeInTheDocument()
    })

    it('calls onOpenTBRList when TBR list badge clicked', () => {
      const mockOnOpenTBRList = vi.fn()
      const tbrLists = [
        { id: 'list1', name: 'Favorites', bookIds: ['123'] }
      ]

      render(
        <BookDetailModal
          book={mockBook}
          onClose={mockOnClose}
          tbrLists={tbrLists}
          onOpenTBRList={mockOnOpenTBRList}
        />
      )

      fireEvent.click(screen.getByText('Favorites'))

      expect(mockOnOpenTBRList).toHaveBeenCalledWith(tbrLists[0])
    })
  })
})
