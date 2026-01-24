import { useState, useCallback } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase/config'
import { isAdmin } from '../config/adminConfig'

export function useAdmin(user) {
  const [users, setUsers] = useState([])
  const [userBooks, setUserBooks] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)

  const canAccess = user?.email && isAdmin(user.email)

  const fetchUsers = useCallback(async () => {
    if (!canAccess) return
    setLoading(true)
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('lastActive', 'desc'))
      const snapshot = await getDocs(q)
      const userList = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }))
      setUsers(userList)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }, [canAccess])

  const fetchUserBooks = useCallback(async (uid) => {
    if (!canAccess) return
    setLoading(true)
    try {
      const booksRef = collection(db, 'users', uid, 'books')
      const snapshot = await getDocs(booksRef)
      const books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setUserBooks(books)
      setSelectedUser(uid)
    } catch (error) {
      console.error('Failed to fetch user books:', error)
    } finally {
      setLoading(false)
    }
  }, [canAccess])

  const clearSelectedUser = useCallback(() => {
    setSelectedUser(null)
    setUserBooks([])
  }, [])

  return {
    users,
    userBooks,
    loading,
    selectedUser,
    canAccess,
    fetchUsers,
    fetchUserBooks,
    clearSelectedUser
  }
}
