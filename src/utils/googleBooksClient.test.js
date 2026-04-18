import { describe, it, expect, vi, beforeEach } from 'vitest'

const { callableMock, authState } = vi.hoisted(() => ({
  callableMock: vi.fn(),
  authState: { currentUser: { uid: 'test-user' } }
}))

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => callableMock)
}))

vi.mock('../firebase/config', () => ({
  auth: authState,
  functions: {}
}))

describe('googleBooksClient', () => {
  beforeEach(() => {
    callableMock.mockReset()
    authState.currentUser = { uid: 'test-user' }
  })

  it('returns the normalized book from the callable response', async () => {
    callableMock.mockResolvedValue({
      data: {
        book: {
          title: 'Dune',
          author: 'Frank Herbert',
          isbn: '9780441172719'
        }
      }
    })

    const { lookupBookByIsbn } = await import('./googleBooksClient')
    await expect(lookupBookByIsbn('9780441172719')).resolves.toEqual({
      title: 'Dune',
      author: 'Frank Herbert',
      isbn: '9780441172719'
    })
  })

  it('returns null when the callable finds no book', async () => {
    callableMock.mockResolvedValue({ data: { book: null } })

    const { lookupBookByIsbn } = await import('./googleBooksClient')
    await expect(lookupBookByIsbn('9780441172719')).resolves.toBeNull()
  })

  it('returns normalized search results from the callable response', async () => {
    callableMock.mockResolvedValue({
      data: {
        books: [
          {
            title: 'Dune',
            author: 'Frank Herbert',
            isbn: '9780441172719'
          }
        ]
      }
    })

    const { searchBooks } = await import('./googleBooksClient')
    await expect(searchBooks({ title: 'Dune', author: 'Frank Herbert' })).resolves.toEqual([
      {
        title: 'Dune',
        author: 'Frank Herbert',
        isbn: '9780441172719'
      }
    ])
  })

  it('returns lightweight cover options from the callable response', async () => {
    callableMock.mockResolvedValue({
      data: {
        covers: [
          {
            url: 'https://example.com/dune.jpg',
            source: 'Dune (1965)'
          }
        ]
      }
    })

    const { searchBookCovers } = await import('./googleBooksClient')
    await expect(searchBookCovers({ title: 'Dune', author: 'Frank Herbert' })).resolves.toEqual([
      {
        url: 'https://example.com/dune.jpg',
        source: 'Dune (1965)'
      }
    ])
  })

  it('rejects unauthenticated calls before the callable boundary', async () => {
    authState.currentUser = null

    const { lookupBookByIsbn, searchBooks, searchBookCovers } = await import('./googleBooksClient')

    await expect(lookupBookByIsbn('9780441172719')).rejects.toThrow('User not authenticated')
    await expect(searchBooks({ title: 'Dune' })).rejects.toThrow('User not authenticated')
    await expect(searchBookCovers({ title: 'Dune', author: 'Frank Herbert' })).rejects.toThrow('User not authenticated')
    expect(callableMock).not.toHaveBeenCalled()
  })
})
