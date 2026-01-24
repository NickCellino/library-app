import { useState, useEffect } from 'react'
import { onAuthStateChanged, signInWithPopup, signInAnonymously, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const isEmulatorMode = import.meta.env.VITE_USE_EMULATOR === 'true'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let didAutoSignIn = false

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser && isEmulatorMode && !didAutoSignIn) {
        // Auto sign-in anonymously in emulator mode (only once)
        didAutoSignIn = true
        try {
          await signInAnonymously(auth)
        } catch (error) {
          console.error('Anonymous sign-in failed:', error)
          setLoading(false)
        }
        return
      }

      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid)
        await setDoc(userRef, {
          email: firebaseUser.email || 'anonymous',
          lastActive: serverTimestamp(),
          createdAt: serverTimestamp()
        }, { merge: true })
      }
    })
    return unsubscribe
  }, [])

  const signIn = async () => {
    const provider = new GoogleAuthProvider()
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  return { user, loading, signIn, signOut }
}
