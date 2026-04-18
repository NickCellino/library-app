import { httpsCallable } from 'firebase/functions'
import { auth, functions } from '../firebase/config'

const lookupBookByIsbnFn = httpsCallable(functions, 'lookupBookByIsbn')

export async function lookupBookByIsbn(isbn) {
  if (!auth.currentUser) {
    throw new Error('User not authenticated')
  }

  const result = await lookupBookByIsbnFn({ isbn })
  return result.data.book
}
