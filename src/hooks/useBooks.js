import { useState, useEffect, useCallback } from 'react'
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../firebase/config'

const STORAGE_KEY = 'library-books'

export function useBooks(user) {
  const [books, setBooks] = useState([])
  const [loading, setLoading] = useState(true)
  const [migrationDone, setMigrationDone] = useState(false)

  // Load from localStorage (for signed-out users or initial load)
  const loadFromLocalStorage = useCallback(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch (e) {
        console.error('Failed to parse stored books:', e)
      }
    }
    return []
  }, [])

  // Save to localStorage (for signed-out users)
  const saveToLocalStorage = useCallback((books) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(books))
  }, [])

  // Migrate localStorage to Firestore on first sign-in
  const migrateToFirestore = useCallback(async (userId) => {
    if (!db) return
    const localBooks = loadFromLocalStorage()
    if (localBooks.length === 0) return

    const migrationKey = `library-migrated-${userId}`
    if (localStorage.getItem(migrationKey)) return

    try {
      const batch = writeBatch(db)
      const booksRef = collection(db, 'users', userId, 'books')

      for (const book of localBooks) {
        const bookDoc = doc(booksRef, book.id)
        batch.set(bookDoc, book)
      }

      await batch.commit()
      localStorage.setItem(migrationKey, 'true')
      console.log(`Migrated ${localBooks.length} books to Firestore`)
    } catch (error) {
      console.error('Migration failed:', error)
    }
  }, [loadFromLocalStorage])

  useEffect(() => {
    // Not signed in or Firebase not configured: use localStorage
    if (!user || !isFirebaseConfigured || !db) {
      setBooks(loadFromLocalStorage())
      setLoading(false)
      setMigrationDone(false)
      return
    }

    // Signed in: subscribe to Firestore
    setLoading(true)
    const booksRef = collection(db, 'users', user.uid, 'books')

    const unsubscribe = onSnapshot(booksRef, async (snapshot) => {
      const firestoreBooks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))

      // Migrate on first sign-in if Firestore is empty
      if (!migrationDone && firestoreBooks.length === 0) {
        setMigrationDone(true)
        await migrateToFirestore(user.uid)
        // Don't setBooks here - the onSnapshot will fire again after migration
        return
      }

      setMigrationDone(true)
      setBooks(firestoreBooks)
      setLoading(false)
    }, (error) => {
      console.error('Firestore subscription error:', error)
      setLoading(false)
    })

    return unsubscribe
  }, [user, loadFromLocalStorage, migrateToFirestore, migrationDone])

  // Sync localStorage for signed-out users
  useEffect(() => {
    if ((!user || !isFirebaseConfigured) && !loading) {
      saveToLocalStorage(books)
    }
  }, [books, user, loading, saveToLocalStorage])

  const addBook = useCallback(async (book) => {
    if (!user || !isFirebaseConfigured || !db) {
      setBooks(prev => [...prev, book])
      return
    }

    try {
      const bookRef = doc(db, 'users', user.uid, 'books', book.id)
      await setDoc(bookRef, book)
    } catch (error) {
      console.error('Failed to add book:', error)
      throw error
    }
  }, [user])

  const updateBook = useCallback(async (book) => {
    if (!user || !isFirebaseConfigured || !db) {
      setBooks(prev => prev.map(b => b.id === book.id ? book : b))
      return
    }

    try {
      const bookRef = doc(db, 'users', user.uid, 'books', book.id)
      await setDoc(bookRef, book)
    } catch (error) {
      console.error('Failed to update book:', error)
      throw error
    }
  }, [user])

  const deleteBook = useCallback(async (bookId) => {
    if (!user || !isFirebaseConfigured || !db) {
      setBooks(prev => prev.filter(b => b.id !== bookId))
      return
    }

    try {
      const bookRef = doc(db, 'users', user.uid, 'books', bookId)
      await deleteDoc(bookRef)
    } catch (error) {
      console.error('Failed to delete book:', error)
      throw error
    }
  }, [user])

  const setAllBooks = useCallback(async (newBooks) => {
    if (!user || !isFirebaseConfigured || !db) {
      setBooks(newBooks)
      return
    }

    try {
      // Delete all existing books and add new ones
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
