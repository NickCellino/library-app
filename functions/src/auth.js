import admin from 'firebase-admin'

// Initialize admin SDK (only once)
if (!admin.apps.length) {
  admin.initializeApp()
}

/**
 * Verify Firebase ID token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {Promise<admin.auth.DecodedIdToken>} - Decoded token
 * @throws {Error} - If token invalid or missing
 */
export async function verifyAuth(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }

  const idToken = authHeader.split('Bearer ')[1]

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken)
    return decodedToken
  } catch (error) {
    throw new Error('Invalid ID token: ' + error.message)
  }
}
