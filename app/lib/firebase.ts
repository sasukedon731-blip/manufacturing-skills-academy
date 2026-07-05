import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const requiredEnv = (key: string) => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`)
  }
  return value
}

const firebaseConfig = {
  apiKey: requiredEnv("NEXT_PUBLIC_FIREBASE_API_KEY"),
  authDomain: "manufacturing-skills-academy.firebaseapp.com",
  projectId: "manufacturing-skills-academy",
  storageBucket: "manufacturing-skills-academy.firebasestorage.app",
  messagingSenderId: "184339544494",
  appId: "1:184339544494:web:62ffb24efd7006ca1bf03f",
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
