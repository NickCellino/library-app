import { describe, it, expect, vi, beforeEach } from 'vitest'

const callableMock = vi.fn()

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => callableMock)
}))

vi.mock('../firebase/config', () => ({
  auth: { currentUser: { uid: 'test-user' } },
  functions: {}
}))

describe('googleBooksClient', () => {
  beforeEach(() => {
    callableMock.mockReset()
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
})
