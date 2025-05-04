import { NextResponse } from "next/server"

export async function GET() {
  try {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || "http://localhost:8000"
    console.log(`Checking Python service at ${pythonServiceUrl}/health`)

    const response = await fetch(`${pythonServiceUrl}/health`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    const responseText = await response.text()
    console.log("Python service health check raw response:", responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      return NextResponse.json(
        {
          status: "error",
          message: "Failed to parse Python service response as JSON",
          responseText: responseText.substring(0, 500),
          pythonServiceUrl,
        },
        { status: 500 },
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "error",
          message: "Python service health check failed",
          responseStatus: response.status,
          responseData,
          pythonServiceUrl,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      status: "success",
      message: "Python service is healthy",
      pythonServiceUrl,
      pythonServiceResponse: responseData,
    })
  } catch (error) {
    console.error("Error checking Python service:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Failed to connect to Python service",
        error: error instanceof Error ? error.message : String(error),
        pythonServiceUrl: process.env.PYTHON_SERVICE_URL || "http://localhost:8000",
      },
      { status: 500 },
    )
  }
}
