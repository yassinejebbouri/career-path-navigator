"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { fetchJobs } from "@/lib/api"
import type { Job } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth"
import { Briefcase } from "lucide-react"

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    const getJobs = async () => {
      try {
        const jobsData = await fetchJobs()
        setJobs(jobsData)
      } catch (error) {
        console.error("Failed to fetch jobs:", error)
      } finally {
        setLoading(false)
      }
    }

    getJobs()
  }, [isAuthenticated, router])

  // Function to capitalize first letter of each word
  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase())
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="page-header">Available Job Positions</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-64">
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card key={job.id} className="job-card">
              <CardHeader className="job-card-header">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-purple-100 rounded-md">
                    <Briefcase className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="mt-2 text-xl capitalize-words">{capitalizeWords(job.name)}</CardTitle>
              </CardHeader>
              <CardContent className="job-card-body">
                <p className="text-gray-600 text-sm line-clamp-4">{job.definition}</p>
              </CardContent>
              <CardFooter className="job-card-footer">
                <Button
                  variant="outline"
                  className="w-full border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                  onClick={() => router.push(`/jobs/${job.id}`)}
                >
                  View Required Skills
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
