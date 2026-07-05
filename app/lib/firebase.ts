import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC6-tmM2fR1nEUYzQW3w-5So7eLmKmqyZI",
  authDomain: "manufacturing-skills-academy.firebaseapp.com",
  projectId: "manufacturing-skills-academy",
  storageBucket: "manufacturing-skills-academy.firebasestorage.app",
  messagingSenderId: "184339544494",
  appId: "1:184339544494:web:62ffb24efd7006ca1bf03f",
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
