import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const forceLocal = import.meta.env.VITE_USE_LOCAL_DATA === 'true'
const hasFirebaseConfig = Boolean(String(import.meta.env.VITE_FIREBASE_API_KEY || '').trim())

export const useLocalPortalData = forceLocal || !hasFirebaseConfig

let app = null
let db = null
let storage = null

if (!useLocalPortalData) {
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    ...(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
      ? { measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID }
      : {}),
  }
  app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  storage = getStorage(app)
}

export { app, db, storage }
