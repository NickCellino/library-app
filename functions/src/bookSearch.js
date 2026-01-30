/**
 * Search Google Books API for matching books
 */
import { defineSecret } from 'firebase-functions/params'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

export const googleBooksApiKey = defineSecret('GOOGLE_BOOKS_API_KEY')

/**
 * Score a book result based on how well it matches candidates
 * @param {Object} book - Book result
 * @param {{ titleCandidates: string[], authorCandidates: string[] }} candidates
 * @returns {number} - Score (higher is better)
 */
function scoreResult(book, candidates) {
  let score = 0
  const bookTitle = (book.title || '').toLowerCase()
  const bookAuthor = (book.author || '').toLowerCase()

  // Title matching
  for (const title of candidates.titleCandidates) {
    const t = title.toLowerCase()
    if (bookTitle === t) {
      score += 100 // Exact match
    } else if (bookTitle.includes(t) || t.includes(bookTitle)) {
      score += 50 // Partial match
    } else if (t.split(' ').some(word => word.length > 3 && bookTitle.includes(word))) {
      score += 20 // Word match
    }
  }

  // Author matching
  for (const author of candidates.authorCandidates) {
    const a = author.toLowerCase()
    if (bookAuthor === a) {
      score += 80 // Exact author match
    } else if (bookAuthor.includes(a) || a.includes(bookAuthor)) {
      score += 40 // Partial author match
    } else {
      // Check individual names
      const authorWords = a.split(' ').filter(w => w.length > 2)
      const matchedWords = authorWords.filter(word => bookAuthor.includes(word))
      if (matchedWords.length > 0) {
        score += 15 * matchedWords.length
      }
    }
  }

  return score
}

/**
 * Search Google Books with a query
 * @param {string} query - Search query
 * @param {number} maxResults - Max results to return
 * @returns {Promise<Array>} - Array of book objects
 */
export async function searchBooks(query, maxResults = 5) {
  if (!query || !query.trim()) return []

  const url = new URL(GOOGLE_BOOKS_API)
  url.searchParams.set('q', query)
  url.searchParams.set('maxResults', maxResults.toString())
  url.searchParams.set('printType', 'books')
  url.searchParams.set('key', googleBooksApiKey.value())

  try {
    const response = await fetch(url.toString())
    if (!response.ok) {
      throw new Error(`Google Books API error: ${response.status}`)
    }

    const data = await response.json()

    if (!data.items || data.items.length === 0) {
      return []
    }

    return data.items.map(item => formatBookResult(item))
  } catch (error) {
    console.error('Google Books search error:', error)
    return []
  }
}

/**
 * Search with multiple queries, dedupe and rank results
 * @param {string[]} queries - Array of search queries
 * @param {number} maxTotal - Max total results
 * @param {{ titleCandidates: string[], authorCandidates: string[] }} candidates - OCR candidates for scoring
 * @returns {Promise<Array>} - Deduplicated, ranked book results
 */
export async function searchWithMultipleQueries(queries, maxTotal = 10, candidates = null) {
  const seen = new Set()
  const results = []

  for (const query of queries) {
    const books = await searchBooks(query, 5)

    for (const book of books) {
      // Dedupe by title+author
      const key = `${book.title?.toLowerCase()}|${book.author?.toLowerCase()}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push(book)
      }
    }
  }

  // Score and sort if candidates provided
  if (candidates && (candidates.titleCandidates.length > 0 || candidates.authorCandidates.length > 0)) {
    for (const book of results) {
      book._score = scoreResult(book, candidates)
    }
    results.sort((a, b) => b._score - a._score)

    // Remove internal score from output
    for (const book of results) {
      delete book._score
    }
  }

  return results.slice(0, maxTotal)
}

function formatBookResult(item) {
  const info = item.volumeInfo || {}
  const imageLinks = info.imageLinks || {}

  return {
    googleBooksId: item.id,
    title: info.title || '',
    author: info.authors?.join(', ') || '',
    publishYear: info.publishedDate ? parseInt(info.publishedDate.slice(0, 4)) : null,
    publisher: info.publisher || '',
    pageCount: info.pageCount || null,
    coverUrl: imageLinks.thumbnail?.replace('http:', 'https:') || '',
    isbn: extractISBN(info.industryIdentifiers)
  }
}

function extractISBN(identifiers) {
  if (!identifiers) return ''

  // Prefer ISBN_13 over ISBN_10
  const isbn13 = identifiers.find(id => id.type === 'ISBN_13')
  if (isbn13) return isbn13.identifier

  const isbn10 = identifiers.find(id => id.type === 'ISBN_10')
  if (isbn10) return isbn10.identifier

  return ''
}
