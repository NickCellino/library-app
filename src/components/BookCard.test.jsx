import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BookCard from '../components/BookCard'

describe('BookCard', () => {
  const mockBook = {
    id: '123',
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    coverUrl: 'https://example.com/cover.jpg',
    pageCount: 180,
    publishYear: 1925,
  }

  it('renders book title', () => {
    render(<BookCard book={mockBook} onClick={() => {}} />)
    expect(screen.getByText('The Great Gatsby')).toBeInTheDocument()
  })

  it('renders book author', () => {
    render(<BookCard book={mockBook} onClick={() => {}} />)
    expect(screen.getByText('F. Scott Fitzgerald')).toBeInTheDocument()
  })

  it('renders page count and year in meta', () => {
    render(<BookCard book={mockBook} onClick={() => {}} />)
    expect(screen.getByText('180 pp · 1925')).toBeInTheDocument()
  })

  it('renders cover image with alt text', () => {
    render(<BookCard book={mockBook} onClick={() => {}} />)
    const img = screen.getByAltText('Cover of The Great Gatsby')
    expect(img).toBeInTheDocument()
    expect(img.src).toBe('https://example.com/cover.jpg')
  })

  it('renders placeholder when no cover URL', () => {
    const bookWithoutCover = { ...mockBook, coverUrl: null }
    render(<BookCard book={bookWithoutCover} onClick={() => {}} />)
    expect(screen.getByText('📖')).toBeInTheDocument()
  })

  it('calls onClick with book when clicked', () => {
    const onClick = vi.fn()
    render(<BookCard book={mockBook} onClick={onClick} />)
    
    fireEvent.click(screen.getByText('The Great Gatsby'))
    expect(onClick).toHaveBeenCalledWith(mockBook)
  })

  it('shows remove button when showRemove is true', () => {
    render(<BookCard book={mockBook} onClick={() => {}} showRemove={true} onRemove={() => {}} />)
    expect(screen.getByTitle('Remove from list')).toBeInTheDocument()
  })

  it('does not show remove button when showRemove is false', () => {
    render(<BookCard book={mockBook} onClick={() => {}} showRemove={false} />)
    expect(screen.queryByTitle('Remove from list')).not.toBeInTheDocument()
  })

  it('calls onRemove with book id when remove clicked', () => {
    const onRemove = vi.fn()
    render(<BookCard book={mockBook} onClick={() => {}} showRemove={true} onRemove={onRemove} />)
    
    fireEvent.click(screen.getByTitle('Remove from list'))
    expect(onRemove).toHaveBeenCalledWith('123')
  })

  it('does not call onClick when remove button clicked', () => {
    const onClick = vi.fn()
    const onRemove = vi.fn()
    render(<BookCard book={mockBook} onClick={onClick} showRemove={true} onRemove={onRemove} />)
    
    fireEvent.click(screen.getByTitle('Remove from list'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
