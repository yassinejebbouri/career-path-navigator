"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export function DebugPythonService() {
  const [serviceStatus, setServiceStatus] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkPythonService = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/check-python-service")
      const data = await response.json()

      if (data.status === "error") {
        setError(data.message)
      } else {
        setServiceStatus(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to check Python service")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Python Service Status</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={checkPythonService} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking...
            </>
          ) : (
            "Check Python Service"
          )}
        </Button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            <p className="font-medium">Error:</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {serviceStatus && !error && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
            <p className="font-medium">Service is healthy</p>
            <p className="text-sm">URL: {serviceStatus.pythonServiceUrl}</p>
            {serviceStatus.pythonServiceResponse && (
              <div className="mt-2">
                <p className="font-medium">Service Details:</p>
                <pre className="text-xs mt-1 bg-white p-2 rounded overflow-auto max-h-40">
                  {JSON.stringify(serviceStatus.pythonServiceResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
