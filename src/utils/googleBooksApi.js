/**
 * Fetch book data from Google Books API by ISBN
 * @param {string} isbn - ISBN to look up
 * @returns {Promise<{title, author, publishYear, publisher, pageCount, coverUrl}|null>}
 */
export async function fetchBookByISBN(isbn) {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const url = apiKey
    ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&key=${apiKey}`
    : `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Try again in a moment.')
    }
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    return null
  }

  const book = data.items[0].volumeInfo
  return {
    title: book.title || '',
    author: book.authors?.[0] || '',
    publishYear: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
    publisher: book.publisher || '',
    pageCount: book.pageCount || null,
    coverUrl: book.imageLinks?.thumbnail || ''
  }
}
