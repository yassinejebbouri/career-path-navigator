"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useEffect } from "react"
import Image from "next/image"
import { Briefcase, BookOpen, LineChart } from "lucide-react"

export default function Welcome() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  if (!user) {
    return null
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] bg-gray-50 px-4 py-12">
      <div className="max-w-3xl w-full text-center">
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4">Welcome to Concept2Career</h1>
        <p className="text-lg text-slate-600 mb-8">
          Hello, <span className="font-semibold">{user.name}</span>! Discover your ideal career path and the skills you need to succeed.
        </p>
  
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-lg border p-6 bg-white shadow-sm">
            <Briefcase className="h-6 w-6 text-purple-600 mb-2 mx-auto" />
            <h3 className="text-md font-semibold text-slate-800 mb-1">Explore Jobs</h3>
            <p className="text-sm text-slate-600">Browse available roles and their required skills.</p>
          </div>
          <div className="rounded-lg border p-6 bg-white shadow-sm">
            <LineChart className="h-6 w-6 text-cyan-600 mb-2 mx-auto" />
            <h3 className="text-md font-semibold text-slate-800 mb-1">Assess Skills</h3>
            <p className="text-sm text-slate-600">Understand your strengths and identify skill gaps.</p>
          </div>
          <div className="rounded-lg border p-6 bg-white shadow-sm">
            <BookOpen className="h-6 w-6 text-amber-600 mb-2 mx-auto" />
            <h3 className="text-md font-semibold text-slate-800 mb-1">Learning Paths</h3>
            <p className="text-sm text-slate-600">Receive custom learning paths to grow your skills.</p>
          </div>
        </div>
  
        <Button
          size="lg"
          onClick={() => router.push("/jobs")}
          className="px-8 py-6 text-lg bg-slate-700 hover:bg-slate-800"
        >
          Discover Available Jobs
        </Button>
      </div>
    </main>
  )
}
