import { httpsCallable } from 'firebase/functions'
import { functions, auth } from '../firebase/config'

const recognizeCoverFn = httpsCallable(functions, 'recognizeCover')

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

  const result = await recognizeCoverFn({ imageBase64: base64Image })
  return result.data
}
