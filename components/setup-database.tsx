"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function SetupDatabase() {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSetup = async () => {
    setIsLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/setup", {
        method: "POST",
      })
      const data = await response.json()

      if (data.status === "success") {
        setMessage(data.message)
      } else {
        setError(data.message || "An error occurred")
      }
    } catch (err) {
      setError("Failed to set up database")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-slate-50 mt-4">
      <h3 className="font-medium mb-2">Database Setup</h3>
      <p className="text-sm text-slate-600 mb-4">
        Click the button below to set up a demo user without affecting your Neo4j data.
      </p>
      <Button onClick={handleSetup} disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up...
          </>
        ) : (
          "Set up demo user"
        )}
      </Button>
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  )
}
