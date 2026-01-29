import { initializeApp } from 'firebase/app'
import { getAuth, connectAuthEmulator } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator } from 'firebase/firestore'
import { getStorage, connectStorageEmulator } from 'firebase/storage'
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})

// Initialize storage (will work with emulator even if not set up in production)
let storage
try {
  storage = getStorage(app)
} catch (error) {
  console.warn('Firebase Storage initialization failed:', error)
  // Storage will be undefined if not available
}

const functions = getFunctions(app)

// Connect to emulators in test mode
if (import.meta.env.VITE_USE_EMULATOR === 'true') {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080)
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true })
    connectFunctionsEmulator(functions, 'localhost', 5001)
    if (storage) {
      connectStorageEmulator(storage, 'localhost', 9199)
    }
  } catch {
    // Already connected (hot reload)
  }
}

// One-time cleanup of legacy localStorage data
const cleanupLegacyStorage = () => {
  const keys = Object.keys(localStorage)
  for (const key of keys) {
    if (key === 'library-books' || key.startsWith('library-migrated-')) {
      localStorage.removeItem(key)
    }
  }
}
cleanupLegacyStorage()

export { auth, db, storage, functions }
export default app
