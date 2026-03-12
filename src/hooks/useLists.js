import { useState, useEffect, useCallback } from 'react'
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, query, orderBy, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase/config'
import { v4 as uuidv4 } from '../utils/uuid'

export function useLists(user) {
  const [lists, setLists] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLists([])
      setLoading(false)
      return
    }

    setLoading(true)
    const listsRef = collection(db, 'users', user.uid, 'lists')
    const q = query(listsRef, orderBy('updatedAt', 'desc'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setLists(listsData)
      setLoading(false)
    }, (error) => {
      console.error('Firestore subscription error:', error)
      setLoading(false)
    })

    return unsubscribe
  }, [user])

  const addList = useCallback(async (name) => {
    if (!user) throw new Error('No user')
    
    const truncatedName = name.trim().slice(0, 128)
    if (!truncatedName) throw new Error('List name cannot be empty')
    
    if (lists.some(l => l.name === truncatedName)) {
      throw new Error('List name already exists')
    }

    const listId = uuidv4()
    const listData = {
      id: listId,
      name: truncatedName,
      bookIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    await setDoc(doc(db, 'users', user.uid, 'lists', listId), listData)
  }, [user, lists])

  const updateList = useCallback(async (list) => {
    if (!user) return
    
    const truncatedName = list.name.trim().slice(0, 128)
    if (!truncatedName) throw new Error('List name cannot be empty')
    
    const otherList = lists.find(l => l.name === truncatedName && l.id !== list.id)
    if (otherList) {
      throw new Error('List name already exists')
    }

    const updatedList = {
      ...list,
      name: truncatedName,
      updatedAt: new Date().toISOString()
    }

    await setDoc(doc(db, 'users', user.uid, 'lists', list.id), updatedList)
  }, [user, lists])

  const deleteList = useCallback(async (listId) => {
    if (!user) return
    await deleteDoc(doc(db, 'users', user.uid, 'lists', listId))
  }, [user])

  const addBookToList = useCallback(async (listId, bookId) => {
    if (!user) return
    
    const list = lists.find(l => l.id === listId)
    if (!list) return
    
    if (list.bookIds.includes(bookId)) return

    await updateDoc(doc(db, 'users', user.uid, 'lists', listId), {
      bookIds: arrayUnion(bookId),
      updatedAt: new Date().toISOString()
    })
  }, [user, lists])

  const removeBookFromList = useCallback(async (listId, bookId) => {
    if (!user) return
    
    const list = lists.find(l => l.id === listId)
    if (!list) return

    await updateDoc(doc(db, 'users', user.uid, 'lists', listId), {
      bookIds: arrayRemove(bookId),
      updatedAt: new Date().toISOString()
    })
  }, [user, lists])

  const removeBookFromAllLists = useCallback(async (bookId) => {
    if (!user) return

    const batch = writeBatch(db)

    lists.forEach(list => {
      if (list.bookIds.includes(bookId)) {
        const listRef = doc(db, 'users', user.uid, 'lists', list.id)
        batch.update(listRef, {
          bookIds: arrayRemove(bookId),
          updatedAt: new Date().toISOString()
        })
      }
    })

    await batch.commit()
  }, [user, lists])

  const moveBookBetweenLists = useCallback(async (bookId, fromListId, toListId) => {
    if (!user) return
    if (fromListId === toListId) return

    const batch = writeBatch(db)
    const fromListRef = doc(db, 'users', user.uid, 'lists', fromListId)
    const toListRef = doc(db, 'users', user.uid, 'lists', toListId)

    batch.update(fromListRef, {
      bookIds: arrayRemove(bookId),
      updatedAt: new Date().toISOString()
    })

    batch.update(toListRef, {
      bookIds: arrayUnion(bookId),
      updatedAt: new Date().toISOString()
    })

    await batch.commit()
  }, [user])

  const getListsForBook = useCallback((bookId) => {
    return lists
      .filter(list => list.bookIds.includes(bookId))
      .map(list => list.name)
  }, [lists])

  return {
    lists,
    loading,
    addList,
    updateList,
    deleteList,
    addBookToList,
    removeBookFromList,
    getListsForBook,
    removeBookFromAllLists,
    moveBookBetweenLists
  }
}
