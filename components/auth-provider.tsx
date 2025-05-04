"use client"

import type React from "react"

import { useEffect } from "react"
import { initAuth } from "@/lib/auth"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize auth on mount and clean up on unmount
    const unsubscribe = initAuth()
    return () => unsubscribe()
  }, [])

  return <>{children}</>
}
