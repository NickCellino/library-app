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
      const batch = writeBatch(db)
      const booksRef = collection(db, 'users', user.uid, 'books')

      // Delete existing
      for (const book of books) {
        batch.delete(doc(booksRef, book.id))
      }

      // Add new
      for (const book of newBooks) {
        batch.set(doc(booksRef, book.id), book)
      }

      await batch.commit()
    } catch (error) {
      console.error('Failed to set books:', error)
      throw error
    }
  }, [user, books])

  return { books, loading, addBook, updateBook, deleteBook, setAllBooks }
}
