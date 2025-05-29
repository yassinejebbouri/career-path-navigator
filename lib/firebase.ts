import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"

// Your web app's Firebase configuration
// Replace these values with your Firebase project configuration
const firebaseConfig = {
  apiKey: ,
  authDomain: ,
  projectId: ,
  storageBucket: ,
  messagingSenderId: ,
  appId: ,
  measurementId: 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export default app

// Initialize Firebase Authentication
export const auth = getAuth(app)


