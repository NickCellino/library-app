/**
 * Fetch book data from Google Books API by ISBN
 * @param {string} isbn - ISBN to look up
 * @returns {Promise<{title, author, publishYear, publisher, pageCount, coverUrl}|null>}
 */
export async function fetchBookByISBN(isbn) {
  const response = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
  )

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`)
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
