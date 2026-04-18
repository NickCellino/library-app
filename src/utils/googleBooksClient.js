import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../firebase/config'

const lookupBookByIsbnFn = httpsCallable(functions, 'lookupBookByIsbn')
const searchBooksFn = httpsCallable(functions, 'searchBooks')
const searchBookCoversFn = httpsCallable(functions, 'searchBookCovers')

export async function lookupBookByIsbn(isbn) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const result = await lookupBookByIsbnFn({ isbn })
  return result.data.book
}

export async function searchBooks({ title = '', author = '' }) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const result = await searchBooksFn({ title, author })
  return result.data.books
}

export async function searchBookCovers({ title = '', author = '' }) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const result = await searchBookCoversFn({ title, author })
  return result.data.covers
}
