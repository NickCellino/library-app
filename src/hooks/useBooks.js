import { useState, useEffect, useCallback } from 'react'
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { db } from '../firebase/config'

export function useBooks(user) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setBooks([])
      setLoading(false)
      return
    }

    setLoading(true)
    const booksRef = collection(db, 'users', user.uid, 'books')

    const unsubscribe = onSnapshot(booksRef, (snapshot) => {
      const firestoreBooks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))
      setBooks(firestoreBooks)
      setLoading(false)
      // Update user profile bookCount
      const userRef = doc(db, 'users', user.uid)
      setDoc(userRef, { bookCount: firestoreBooks.length }, { merge: true })
        .catch(err => console.error('Failed to update bookCount:', err))
    }, (error) => {
      console.error('Firestore subscription error:', error)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addBook = useCallback(async (book) => {
    if (!user) return
    try {
      const bookRef = doc(db, 'users', user.uid, 'books', book.id)
      await setDoc(bookRef, book)
    } catch (error) {
      console.error('Failed to add book:', error)
      throw error
    }
  }, [user])

  const updateBook = useCallback(async (book) => {
    if (!user) return
    try {
      const bookRef = doc(db, 'users', user.uid, 'books', book.id)
      await setDoc(bookRef, book)
    } catch (error) {
      console.error('Failed to update book:', error)
      throw error
    }
  }, [user])

  const deleteBook = useCallback(async (bookId) => {
    if (!user) return
    try {
      const bookRef = doc(db, 'users', user.uid, 'books', bookId)
      await deleteDoc(bookRef)
    } catch (error) {
      console.error('Failed to delete book:', error)
      throw error
    }
  }, [user])

  const setAllBooks = useCallback(async (newBooks) => {
    if (!user) return
    try {
      const booksRef = collection(db, 'users', user.uid, 'books')
      const MAX_BATCH_SIZE = 500

      // Build all operations
      const allOps = [
        ...books.map(book => ({ type: 'delete', id: book.id })),
        ...newBooks.map(book => ({ type: 'set', book }))
      ]

      // Chunk into batches of 500 (Firestore limit)
      for (let i = 0; i < allOps.length; i += MAX_BATCH_SIZE) {
        const batch = writeBatch(db)
        const chunk = allOps.slice(i, i + MAX_BATCH_SIZE)

        for (const op of chunk) {
          if (op.type === 'delete') {
            batch.delete(doc(booksRef, op.id))
          } else {
            batch.set(doc(booksRef, op.book.id), op.book)
          }
        }

        await batch.commit()
      }
    } catch (error) {
      console.error('Failed to set books:', error)
      throw error
    }
  }, [user, books])

  return { books, loading, addBook, updateBook, deleteBook, setAllBooks }
}
