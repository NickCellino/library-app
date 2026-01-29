import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '../firebase/config'

/**
 * Upload book cover image to Firebase Storage
 * @param {Object} user - Firebase auth user object
 * @param {string} bookId - Book ID (used in storage path)
 * @param {Blob} imageBlob - Processed image blob
 * @returns {Promise<string>} - Download URL
 */
export async function uploadBookCover(user, bookId, imageBlob) {
  if (!user) {
    throw new Error('User must be authenticated to upload images')
  }

  const storageRef = ref(storage, `users/${user.uid}/covers/${bookId}.jpg`)

  try {
    const snapshot = await uploadBytes(storageRef, imageBlob, {
      contentType: 'image/jpeg'
    })

    const downloadURL = await getDownloadURL(snapshot.ref)
    return downloadURL
  } catch (error) {
    console.error('Error uploading cover image:', error)
    throw new Error('Failed to upload cover image')
  }
}

/**
 * Delete book cover from Firebase Storage
 * @param {Object} user - Firebase auth user object
 * @param {string} bookId - Book ID (used in storage path)
 * @returns {Promise<void>}
 */
export async function deleteBookCover(user, bookId) {
  if (!user) {
    throw new Error('User must be authenticated to delete images')
  }

  const storageRef = ref(storage, `users/${user.uid}/covers/${bookId}.jpg`)

  try {
    await deleteObject(storageRef)
  } catch (error) {
    // Ignore errors if file doesn't exist
    if (error.code !== 'storage/object-not-found') {
      console.error('Error deleting cover image:', error)
    }
  }
}

/**
 * Check if a URL is a Firebase Storage URL (user-uploaded cover)
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isFirebaseStorageUrl(url) {
  if (!url) return false
  return url.includes('firebasestorage.googleapis.com') || url.includes('storage.googleapis.com')
}
