import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth'
import { auth } from '../firebase/config'

// Test mode: bypass real auth with fake user
// Use URL param for unique user ID per test, fallback to fixed ID
function getTestUser() {
  if (import.meta.env.VITE_TEST_AUTH !== 'true') return null

  // Check URL for test user ID
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    const testUserId = params.get('testUserId')
    if (testUserId) {
      return { uid: testUserId, email: `${testUserId}@test.com` }
    }
  }

  return { uid: 'test-user-default', email: 'test@test.com' }
}

export function useAuth() {
  const [testUser] = useState(() => getTestUser())
  const [user, setUser] = useState(testUser)
  const [loading, setLoading] = useState(!testUser)

  useEffect(() => {
    if (testUser) return

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return unsubscribe
  }, [testUser])

  const signIn = async () => {
    if (testUser) return
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    if (testUser) return
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return { user, loading, signIn, signOut }
}
