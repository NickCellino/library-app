// NOTE: UID 'ymd1Tw0yP7Mu6vgWCJ0s8FomGMq1' in firestore.rules must match this email
export const ADMIN_EMAILS = ['nacellino@gmail.com']
export const isAdmin = (email) => ADMIN_EMAILS.includes(email)
