/**
 * Search Google Books API for matching books
 */

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

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
 * Search with multiple queries, dedupe results
 * @param {string[]} queries - Array of search queries
 * @param {number} maxTotal - Max total results
 * @returns {Promise<Array>} - Deduplicated book results
 */
export async function searchWithMultipleQueries(queries, maxTotal = 10) {
  const seen = new Set()
  const results = []

  for (const query of queries) {
    if (results.length >= maxTotal) break

    const books = await searchBooks(query, 5)

    for (const book of books) {
      // Dedupe by title+author
      const key = `${book.title?.toLowerCase()}|${book.author?.toLowerCase()}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push(book)
        if (results.length >= maxTotal) break
      }
    }
  }

  return results
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
