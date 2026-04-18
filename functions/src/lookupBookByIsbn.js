import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { googleBooksApiKey, lookupBookByIsbn as lookupBookByIsbnInGoogleBooks } from './googleBooksService.js'

export const lookupBookByIsbn = onCall(
  {
    maxInstances: 10,
    secrets: [googleBooksApiKey]
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const isbn = request.data?.isbn?.trim()
    if (!isbn) {
      throw new HttpsError('invalid-argument', 'Missing isbn')
    }

    try {
      const book = await lookupBookByIsbnInGoogleBooks(isbn)
      return { book }
    } catch (error) {
      console.error('lookupBookByIsbn error:', error, 'uid:', request.auth.uid)
      throw new HttpsError('internal', 'Failed to look up book')
    }
  }
)
