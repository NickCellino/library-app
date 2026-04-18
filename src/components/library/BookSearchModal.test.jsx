import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const { searchBooksMock } = vi.hoisted(() => ({
  searchBooksMock: vi.fn()
}))

vi.mock('../../utils/googleBooksClient', () => ({
  searchBooks: searchBooksMock
}))

import BookSearchModal from './BookSearchModal'

describe('BookSearchModal', () => {
  const onClose = vi.fn()
  const onAdd = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('searches through the backend client after the debounce window', async () => {
    searchBooksMock.mockResolvedValue([
      {
        title: 'Dune',
        author: 'Frank Herbert',
        publishYear: 1965,
        isbn: '9780441172719'
      }
    ])

    render(<BookSearchModal onClose={onClose} onAdd={onAdd} books={[]} />)

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'Dune' } })
    fireEvent.change(screen.getByPlaceholderText('Author'), { target: { value: 'Frank Herbert' } })

    await vi.advanceTimersByTimeAsync(500)
    vi.useRealTimers()

    expect(searchBooksMock).toHaveBeenCalledWith({ title: 'Dune', author: 'Frank Herbert' })
    expect(await screen.findByText('Dune')).toBeInTheDocument()
    expect(screen.getByText('Frank Herbert')).toBeInTheDocument()
  })

  it('does not search until one query has at least two characters', async () => {
    render(<BookSearchModal onClose={onClose} onAdd={onAdd} books={[]} />)

    fireEvent.change(screen.getByPlaceholderText('Title'), { target: { value: 'D' } })

    await vi.advanceTimersByTimeAsync(500)

    expect(searchBooksMock).not.toHaveBeenCalled()
    expect(screen.getByText('Type at least 2 characters')).toBeInTheDocument()
  })
})
