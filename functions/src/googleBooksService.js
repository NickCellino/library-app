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
