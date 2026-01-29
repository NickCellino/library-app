import { auth } from '../firebase/config'

// Function URL - set via env or use emulator
const FUNCTION_URL = import.meta.env.VITE_FUNCTIONS_URL
  ? `${import.meta.env.VITE_FUNCTIONS_URL}/recognizeCover`
  : import.meta.env.VITE_USE_EMULATOR === 'true'
    ? 'http://localhost:5001/library-app-d4987/us-central1/recognizeCover'
    : `https://us-central1-${import.meta.env.VITE_FIREBASE_PROJECT_ID}.cloudfunctions.net/recognizeCover`

/**
 * Recognize book from cover image using Cloud Vision
 * @param {string} base64Image - Base64 encoded image (with or without data URI prefix)
 * @returns {Promise<{
 *   rawText: string,
 *   candidates: { titleCandidates: string[], authorCandidates: string[] },
 *   searchQueries: string[],
 *   books: Array<{ title, author, coverUrl, isbn, publishYear, publisher, pageCount }>
 * }>}
 */
export async function recognizeBookCover(base64Image) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const idToken = await auth.currentUser.getIdToken()

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    },
    body: JSON.stringify({ imageBase64: base64Image })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}
