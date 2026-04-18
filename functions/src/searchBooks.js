import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { googleBooksApiKey, searchBooks as searchGoogleBooks } from './googleBooksService.js'

export const searchBooks = onCall(
  {
    maxInstances: 10,
    secrets: [googleBooksApiKey]
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const title = request.data?.title?.trim() || ''
    const author = request.data?.author?.trim() || ''

    if (!title && !author) {
      throw new HttpsError('invalid-argument', 'Missing title or author')
    }

    try {
      const books = await searchGoogleBooks({ title, author })
      return { books }
    } catch (error) {
      console.error('searchBooks error:', error, 'uid:', request.auth.uid)
      throw new HttpsError('internal', 'Failed to search books')
    }
  }
)
