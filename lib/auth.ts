import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth"
import { auth } from "./firebase"

export interface User {
  id: string
  email: string | null
  name: string | null
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => Promise<void>
}

// Convert Firebase user to our User type
const formatUser = (user: FirebaseUser): User => ({
  id: user.uid,
  email: user.email,
  name: user.displayName || user.email?.split("@")[0] || "User",
})

// Helper function to get a user-friendly error message from Firebase error codes
const getFirebaseErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case "auth/user-not-found":
      return "No account found with this email address."
    case "auth/wrong-password":
      return "Invalid email or password."
    case "auth/invalid-credential":
      return "Invalid email or password."
    case "auth/email-already-in-use":
      return "An account with this email already exists."
    case "auth/weak-password":
      return "Password is too weak. Please use a stronger password."
    case "auth/invalid-email":
      return "The email address is not valid."
    case "auth/too-many-requests":
      return "Too many unsuccessful login attempts. Please try again later."
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection."
    default:
      return "An error occurred. Please try again."
  }
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password)
          const formattedUser = formatUser(userCredential.user)

          set({
            user: formattedUser,
            isAuthenticated: true,
          })

          return { success: true, message: "Login successful" }
        } catch (error: any) {
          console.error("Login error:", error)

          // Get user-friendly error message
          const errorMessage = getFirebaseErrorMessage(error.code)
          return { success: false, message: errorMessage }
        }
      },

      signup: async (name: string, email: string, password: string) => {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password)

          // Update the user profile with the name
          await updateProfile(userCredential.user, {
            displayName: name,
          })

          const formattedUser = formatUser(userCredential.user)

          set({
            user: formattedUser,
            isAuthenticated: true,
          })

          return { success: true, message: "Account created successfully" }
        } catch (error: any) {
          console.error("Signup error:", error)

          // Get user-friendly error message
          const errorMessage = getFirebaseErrorMessage(error.code)
          return { success: false, message: errorMessage }
        }
      },

      logout: async () => {
        await signOut(auth)
        set({ user: null, isAuthenticated: false })
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)

// Initialize auth state from Firebase
export const initAuth = () => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      useAuth.setState({
        user: formatUser(user),
        isAuthenticated: true,
        isLoading: false,
      })
    } else {
      useAuth.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  })

  return unsubscribe
}
