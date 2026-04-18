import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { googleBooksApiKey, searchBookCovers as searchGoogleBookCovers } from './googleBooksService.js'

export const searchBookCovers = onCall(
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
      const covers = await searchGoogleBookCovers({ title, author })
      return { covers }
    } catch (error) {
      console.error('searchBookCovers error:', error, 'uid:', request.auth.uid)
      throw new HttpsError('internal', 'Failed to search book covers')
    }
  }
)
