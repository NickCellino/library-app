import { onRequest } from 'firebase-functions/v2/https'
import { verifyAuth } from './auth.js'
import { extractTextFromImage } from './visionClient.js'
import { parseOcrText, generateSearchQueries } from './textParser.js'
import { searchWithMultipleQueries } from './bookSearch.js'

/**
 * Cloud Function: Recognize book cover using Vision API
 *
 * POST body: { imageBase64: string }
 * Headers: Authorization: Bearer <firebase-id-token>
 *
 * Response: {
 *   rawText: string,
 *   candidates: { titleCandidates: string[], authorCandidates: string[] },
 *   searchQueries: string[],
 *   books: Array<{ title, author, coverUrl, ... }>
 * }
 */
export const recognizeCover = onRequest(
  {
    cors: true,
    maxInstances: 10,
    memory: '512MiB'
  },
  async (req, res) => {
    // Only accept POST
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' })
      return
    }

    try {
      // Verify auth
      await verifyAuth(req.headers.authorization)
    } catch (error) {
      res.status(401).json({ error: error.message })
      return
    }

    // Validate input
    const { imageBase64 } = req.body
    if (!imageBase64) {
      res.status(400).json({ error: 'Missing imageBase64 in request body' })
      return
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

      res.json({
        rawText,
        candidates,
        searchQueries,
        books
      })
    } catch (error) {
      console.error('recognizeCover error:', error)
      res.status(500).json({ error: 'Failed to process image: ' + error.message })
    }
  }
)
