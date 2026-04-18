import { defineSecret } from 'firebase-functions/params'

const GOOGLE_BOOKS_API = 'https://www.googleapis.com/books/v1/volumes'

export const googleBooksApiKey = defineSecret('GOOGLE_BOOKS_API_KEY')

export async function lookupBookByIsbn(isbn) {
  const normalizedIsbn = isbn?.trim()
  if (!normalizedIsbn) {
    return null
  }

  const url = new URL(GOOGLE_BOOKS_API)
  url.searchParams.set('q', `isbn:${normalizedIsbn}`)
  url.searchParams.set('printType', 'books')
  url.searchParams.set('maxResults', '1')
  url.searchParams.set('key', googleBooksApiKey.value())

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`)
  }

  const data = await response.json()
  if (!data.items?.length) {
    return null
  }

  return formatBookResult(data.items[0])
}

export async function searchBooks({ title = '', author = '', maxResults = 10 } = {}) {
  const normalizedTitle = title.trim()
  const normalizedAuthor = author.trim()

  if (!normalizedTitle && !normalizedAuthor) {
    return []
  }

  const query = buildSearchQuery({ title: normalizedTitle, author: normalizedAuthor })
  const url = new URL(GOOGLE_BOOKS_API)
  url.searchParams.set('q', query)
  url.searchParams.set('printType', 'books')
  url.searchParams.set('maxResults', maxResults.toString())
  url.searchParams.set('key', googleBooksApiKey.value())

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`)
  }

  const data = await response.json()
  if (!data.items?.length) {
    return []
  }

  return data.items.map(formatBookResult)
}

export async function searchBookCovers({ title = '', author = '', maxResults = 8 } = {}) {
  const normalizedTitle = title.trim()
  const normalizedAuthor = author.trim()

  if (!normalizedTitle && !normalizedAuthor) {
    return []
  }

  const query = buildSearchQuery({ title: normalizedTitle, author: normalizedAuthor })
  const url = new URL(GOOGLE_BOOKS_API)
  url.searchParams.set('q', query)
  url.searchParams.set('printType', 'books')
  url.searchParams.set('maxResults', String(maxResults * 2))
  url.searchParams.set('key', googleBooksApiKey.value())

  const response = await fetch(url.toString())
  if (!response.ok) {
    throw new Error(`Google Books API error: ${response.status}`)
  }

  const data = await response.json()
  if (!data.items?.length) {
    return []
  }

  const covers = []
  const seenUrls = new Set()

  for (const item of data.items) {
    const cover = formatCoverOption(item)
    if (!cover || seenUrls.has(cover.url)) {
      continue
    }

    seenUrls.add(cover.url)
    covers.push(cover)

    if (covers.length >= maxResults) {
      break
    }
  }

  return covers
}

function formatBookResult(item) {
  const info = item.volumeInfo || {}
  const imageLinks = info.imageLinks || {}

  return {
    title: info.title || '',
    author: info.authors?.[0] || '',
    publishYear: parsePublishYear(info.publishedDate),
    publisher: info.publisher || '',
    pageCount: info.pageCount || null,
    coverUrl: imageLinks.thumbnail?.replace('http:', 'https:') || '',
    isbn: extractIsbn(info.industryIdentifiers)
  }
}

function formatCoverOption(item) {
  const info = item.volumeInfo || {}
  const thumbnail = info.imageLinks?.thumbnail?.replace('http:', 'https:')
  if (!thumbnail) {
    return null
  }

  let source = info.title || 'Unknown'
  const publishYear = parsePublishYear(info.publishedDate)
  if (publishYear) {
    source += ` (${publishYear})`
  }

  return {
    url: thumbnail,
    source
  }
}

function buildSearchQuery({ title, author }) {
  const parts = []

  if (title) {
    parts.push(`intitle:${title}`)
  }

  if (author) {
    parts.push(`inauthor:${author}`)
  }

  return parts.join('+')
}

function parsePublishYear(publishedDate) {
  if (!publishedDate) return null
  const year = Number.parseInt(publishedDate.slice(0, 4), 10)
  return Number.isNaN(year) ? null : year
}

function extractIsbn(identifiers) {
  if (!identifiers) return ''

  const isbn13 = identifiers.find(identifier => identifier.type === 'ISBN_13')
  if (isbn13) return isbn13.identifier

  const isbn10 = identifiers.find(identifier => identifier.type === 'ISBN_10')
  return isbn10?.identifier || ''
}
