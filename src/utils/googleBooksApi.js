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

/**
 * Fetch book cover from Google Books API by title and author
 * @param {string} title - Book title to search for
 * @param {string} author - Book author to search for
 * @returns {Promise<string>} Cover URL or empty string if not found
 */
export async function fetchBookCoverByTitleAuthor(title, author) {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const query = `intitle:${title}+inauthor:${author}`
  const url = apiKey
    ? `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}`
    : `https://www.googleapis.com/books/v1/volumes?q=${query}`

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Try again in a moment.')
    }
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    return ''
  }

  const book = data.items[0].volumeInfo
  return book.imageLinks?.thumbnail || ''
}

/**
 * Search for books by query string
 * @param {string} query - Search query (title, author, etc)
 * @param {number} maxResults - Maximum results to return (default 10)
 * @returns {Promise<Array>} Array of book objects
 */
export async function searchBooks(query, maxResults = 10) {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const encodedQuery = encodeURIComponent(query)
  const url = apiKey
    ? `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=${maxResults}&key=${apiKey}`
    : `https://www.googleapis.com/books/v1/volumes?q=${encodedQuery}&maxResults=${maxResults}`

  const response = await fetch(url)

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Try again in a moment.')
    }
    throw new Error(`API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data.items || data.items.length === 0) {
    return []
  }

  return data.items.map(item => {
    const book = item.volumeInfo
    // Extract ISBN (prefer ISBN_13, fallback to ISBN_10)
    const isbn13 = book.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier
    const isbn10 = book.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier

    return {
      title: book.title || '',
      author: book.authors?.[0] || '',
      publishYear: book.publishedDate ? new Date(book.publishedDate).getFullYear() : null,
      publisher: book.publisher || '',
      pageCount: book.pageCount || null,
      coverUrl: book.imageLinks?.thumbnail || '',
      isbn: isbn13 || isbn10 || ''
    }
  })
}
