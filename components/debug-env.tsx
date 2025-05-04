"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function DebugEnv() {
  const [showEnv, setShowEnv] = useState(false)

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Environment Variables</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => setShowEnv(!showEnv)} variant="outline" className="mb-4">
          {showEnv ? "Hide" : "Show"} Environment Variables
        </Button>

        {showEnv && (
          <div className="bg-slate-100 p-4 rounded-md">
            <h3 className="font-medium mb-2">Client-side Environment Variables:</h3>
            <pre className="text-xs overflow-auto">
              {JSON.stringify(
                {
                  NEXT_PUBLIC_PYTHON_SERVICE_URL: process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL,
                  // Add other public env vars here
                },
                null,
                2,
              )}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
