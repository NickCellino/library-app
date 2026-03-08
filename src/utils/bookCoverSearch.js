/**
 * Search Google Books API for book covers by title and author
 * Returns multiple cover image URLs from different editions
 * @param {string} title - Book title
 * @param {string} author - Book author
 * @param {number} maxResults - Maximum results to return (default 5)
 * @returns {Promise<Array<{url: string, source: string}>>} Array of cover image options
 */
export async function searchBookCovers(title, author, maxResults = 5) {
  if (!title && !author) {
    throw new Error('Title or author is required to search for covers')
  }

  // Build search query
  const queryParts = []
  if (title) queryParts.push(`intitle:${title}`)
  if (author) queryParts.push(`inauthor:${author}`)
  const query = queryParts.join('+')

  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
  const url = apiKey
    ? `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=${maxResults * 2}&key=${apiKey}`
    : `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=${maxResults * 2}`

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

  // Extract unique cover URLs with their sources
  const covers = []
  const seenUrls = new Set()

  for (const item of data.items) {
    const book = item.volumeInfo
    const thumbnail = book.imageLinks?.thumbnail
    
    if (thumbnail && !seenUrls.has(thumbnail)) {
      seenUrls.add(thumbnail)
      
      // Extract edition info for display
      let source = book.title || 'Unknown'
      if (book.publishedDate) {
        const year = new Date(book.publishedDate).getFullYear()
        source += ` (${year})`
      }
      
      covers.push({
        url: thumbnail,
        source: source
      })

      if (covers.length >= maxResults) {
        break
      }
    }
  }

  return covers
}
