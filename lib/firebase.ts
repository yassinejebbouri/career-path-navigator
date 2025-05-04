import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

// Your web app's Firebase configuration
// Replace these values with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJFMlQ50_3lln_pAs3rpVnS-0O0yfG9tU",
  authDomain: "career-path-navigator-5e4b6.firebaseapp.com",
  projectId: "career-path-navigator-5e4b6",
  storageBucket: "career-path-navigator-5e4b6.firebasestorage.app",
  messagingSenderId: "561316810375",
  appId: "1:561316810375:web:9f0ac4252ae76e1f493222",
  measurementId: "G-W0WCPFWM4M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export default app

// Initialize Firebase Authentication
export const auth = getAuth(app)


