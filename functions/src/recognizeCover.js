import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { extractTextFromImage } from './visionClient.js'
import { parseOcrText, generateSearchQueries } from './textParser.js'
import { searchWithMultipleQueries } from './bookSearch.js'

const MAX_IMAGE_SIZE = 10_000_000 // ~7.5MB decoded image

/**
 * Cloud Function: Recognize book cover using Vision API
 *
 * Request data: { imageBase64: string }
 * Requires Firebase Auth
 *
 * Response: {
 *   rawText: string,
 *   candidates: { titleCandidates: string[], authorCandidates: string[] },
 *   searchQueries: string[],
 *   books: Array<{ title, author, coverUrl, ... }>
 * }
 */
export const recognizeCover = onCall(
  {
    maxInstances: 10,
    memory: '512MiB'
  },
  async (request) => {
    // Auth is automatic with callable functions
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in')
    }

    const { imageBase64 } = request.data || {}

    if (!imageBase64) {
      throw new HttpsError('invalid-argument', 'Missing imageBase64')
    }

    if (imageBase64.length > MAX_IMAGE_SIZE) {
      throw new HttpsError('invalid-argument', 'Image too large')
    }

    // Strip data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    try {
      // 1. Extract text using Vision API
      const rawText = await extractTextFromImage(base64Data)

      // 2. Parse OCR text for candidates
      const candidates = parseOcrText(rawText)

      // 3. Generate search queries
      const searchQueries = generateSearchQueries(candidates)

      // 4. Search Google Books
      const books = await searchWithMultipleQueries(searchQueries, 8)

      return { rawText, candidates, searchQueries, books }
    } catch (error) {
      console.error('recognizeCover error:', error, 'uid:', request.auth.uid)
      throw new HttpsError('internal', 'Failed to process image')
    }
  }
)
