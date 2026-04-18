import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const { lookupBookByIsbnMock } = vi.hoisted(() => ({
  lookupBookByIsbnMock: vi.fn()
}))

vi.mock('../../utils/googleBooksClient', () => ({
  lookupBookByIsbn: lookupBookByIsbnMock
}))

vi.mock('../../firebase/config', () => ({
  auth: { currentUser: null },
  db: {},
  storage: {},
}))

import BookFormModal from './BookFormModal'

describe('BookFormModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSave = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('add mode', () => {
    it('shows "Add Book" title when no book provided', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)
      expect(screen.getByRole('heading', { name: 'Add Book' })).toBeInTheDocument()
    })

    it('shows empty form fields in add mode', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)
      
      expect(screen.getByLabelText('Title *')).toHaveValue('')
      expect(screen.getByLabelText('Author *')).toHaveValue('')
      expect(screen.getByLabelText('ISBN')).toHaveValue('')
    })

    it('has "Add Book" button in add mode', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)
      expect(screen.getByRole('button', { name: 'Add Book' })).toBeInTheDocument()
    })

    it('shows Auto-fill button in add mode', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)
      expect(screen.getByRole('button', { name: 'Auto-fill' })).toBeInTheDocument()
    })

    it('fills the form from backend ISBN lookup', async () => {
      lookupBookByIsbnMock.mockResolvedValue({
        title: 'Dune',
        author: 'Frank Herbert',
        publishYear: 1965,
        publisher: 'Chilton Books',
        pageCount: 412,
        coverUrl: 'https://example.com/dune.jpg'
      })

      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)

      fireEvent.change(screen.getByLabelText('ISBN'), { target: { value: '9780441172719' } })
      fireEvent.click(screen.getByRole('button', { name: 'Auto-fill' }))

      expect(await screen.findByDisplayValue('Dune')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Frank Herbert')).toBeInTheDocument()
      expect(screen.getByDisplayValue('1965')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Chilton Books')).toBeInTheDocument()
      expect(screen.getByDisplayValue('412')).toBeInTheDocument()
      expect(lookupBookByIsbnMock).toHaveBeenCalledWith('9780441172719')
    })
  })

  describe('edit mode', () => {
    const existingBook = {
      id: '123',
      title: 'Existing Book',
      author: 'Existing Author',
      isbn: '1234567890',
      publishYear: 2020,
      publisher: 'Test Publisher',
      pageCount: 300,
      coverUrl: 'https://example.com/cover.jpg'
    }

    it('shows "Edit Book" title when book provided', () => {
      render(<BookFormModal book={existingBook} onClose={mockOnClose} onSave={mockOnSave} />)
      expect(screen.getByText('Edit Book')).toBeInTheDocument()
    })

    it('populates form with book data', () => {
      render(<BookFormModal book={existingBook} onClose={mockOnClose} onSave={mockOnSave} />)
      
      expect(screen.getByLabelText('Title *')).toHaveValue('Existing Book')
      expect(screen.getByLabelText('Author *')).toHaveValue('Existing Author')
      expect(screen.getByLabelText('ISBN')).toHaveValue('1234567890')
    })

    it('has "Save Changes" button in edit mode', () => {
      render(<BookFormModal book={existingBook} onClose={mockOnClose} onSave={mockOnSave} />)
      expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument()
    })

    it('does not show Auto-fill button in edit mode', () => {
      render(<BookFormModal book={existingBook} onClose={mockOnClose} onSave={mockOnSave} />)
      expect(screen.queryByRole('button', { name: 'Auto-fill' })).not.toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('does not save when submitting without title', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)

      fireEvent.change(screen.getByLabelText('Author *'), { target: { value: 'Some Author' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add Book' }))

      expect(mockOnSave).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })

    it('does not save when submitting without author', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)

      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'Some Title' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add Book' }))

      expect(mockOnSave).not.toHaveBeenCalled()
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('form submission', () => {
    it('calls onSave with form data when valid', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)

      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New Book' } })
      fireEvent.change(screen.getByLabelText('Author *'), { target: { value: 'New Author' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add Book' }))

      expect(mockOnSave).toHaveBeenCalledTimes(1)
      const savedBook = mockOnSave.mock.calls[0][0]
      expect(savedBook.title).toBe('New Book')
      expect(savedBook.author).toBe('New Author')
      expect(savedBook.id).toBeDefined()
    })

    it('calls onClose after successful save', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)

      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New Book' } })
      fireEvent.change(screen.getByLabelText('Author *'), { target: { value: 'New Author' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add Book' }))

      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('generates new id for new books', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)

      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New Book' } })
      fireEvent.change(screen.getByLabelText('Author *'), { target: { value: 'New Author' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add Book' }))

      const savedBook = mockOnSave.mock.calls[0][0]
      expect(savedBook.id).toMatch(/^[0-9a-f-]{36}$/)
    })

    it('preserves existing book id in edit mode', () => {
      const existingBook = { id: 'existing-id', title: 'Book', author: 'Author' }
      render(<BookFormModal book={existingBook} onClose={mockOnClose} onSave={mockOnSave} />)

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      const savedBook = mockOnSave.mock.calls[0][0]
      expect(savedBook.id).toBe('existing-id')
    })
  })

  describe('cancel behavior', () => {
    it('calls onClose when cancel button clicked', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)
      
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
      expect(mockOnSave).not.toHaveBeenCalled()
    })

    it('calls onClose when close button clicked', () => {
      render(<BookFormModal onClose={mockOnClose} onSave={mockOnSave} />)
      
      fireEvent.click(screen.getByRole('button', { name: /✕/ }))
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('ISBN duplicate check', () => {
    it('shows error for duplicate ISBN in add mode', () => {
      const existingBooks = [
        { isbn: '1234567890', title: 'Existing', author: 'Author' }
      ]

      render(
        <BookFormModal
          books={existingBooks}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      fireEvent.change(screen.getByLabelText('Title *'), { target: { value: 'New Book' } })
      fireEvent.change(screen.getByLabelText('Author *'), { target: { value: 'New Author' } })
      fireEvent.change(screen.getByLabelText('ISBN'), { target: { value: '1234567890' } })
      fireEvent.click(screen.getByRole('button', { name: 'Add Book' }))

      expect(mockOnSave).not.toHaveBeenCalled()
      expect(screen.getByText(/ISBN already exists/)).toBeInTheDocument()
    })

    it('allows keeping same ISBN in edit mode', () => {
      const existingBook = { id: '1', title: 'Book', author: 'Author', isbn: '1234567890' }
      const existingBooks = [existingBook]

      render(
        <BookFormModal
          book={existingBook}
          books={existingBooks}
          onClose={mockOnClose}
          onSave={mockOnSave}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }))

      expect(mockOnSave).toHaveBeenCalled()
      expect(screen.queryByText(/ISBN already exists/)).not.toBeInTheDocument()
    })
  })
})
