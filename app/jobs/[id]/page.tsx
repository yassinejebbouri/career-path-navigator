"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { fetchJobById, fetchJobSkills } from "@/lib/api"
import type { Job, Skill } from "@/lib/types"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft, Briefcase, Lightbulb, Code, User, X } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { SkillDialog } from "@/components/skill-dialog"

export default function JobDetail({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<Job | null>(null)
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  // Store the ID in a state variable to avoid accessing params directly in effects/callbacks
  const [jobId, setJobId] = useState<string>("")

  // Set the job ID once when the component mounts
  useEffect(() => {
    if (params && params.id) {
      setJobId(params.id)
    }
  }, [params])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Only proceed if we have a job ID
    if (!jobId) return

    const getJobDetails = async () => {
      try {
        const jobData = await fetchJobById(jobId)
        setJob(jobData)

        const skillsData = await fetchJobSkills(jobId)
        setSkills(skillsData)
      } catch (error) {
        console.error("Failed to fetch job details:", error)
      } finally {
        setLoading(false)
      }
    }

    getJobDetails()
  }, [jobId, isAuthenticated, router])

  const handleGeneratePath = useCallback(() => {
    if (jobId) {
      router.push(`/learning-path/${jobId}`)
    }
  }, [jobId, router])

  const handleSkillClick = (skill: Skill) => {
    setSelectedSkill(skill)
    setDialogOpen(true)
  }

  // Function to capitalize first letter of each word
  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase())
  }

  // Function to get the appropriate icon for a skill type
  const getSkillIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType === "technology") {
      return <Code className="h-3.5 w-3.5 mr-1.5" />
    } else if (lowerType === "softskill") {
      return <User className="h-3.5 w-3.5 mr-1.5" />
    } else {
      // For HardSkill and Concept
      return <Lightbulb className="h-3.5 w-3.5 mr-1.5" />
    }
  }

  // Replace the getSkillClass function with this new getSkillColorClass function
  // Function to get the appropriate CSS class for a skill type
  const getSkillColorClass = (skillType: string) => {
    switch (skillType.toLowerCase()) {
      case "hardskill":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "technology":
        return "bg-cyan-100 text-cyan-800 border-cyan-200"
      case "softskill":
        return "bg-amber-100 text-amber-800 border-amber-200"
      case "concept":
        return "bg-purple-100 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
        </Button>

        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />

            <h3 className="text-xl font-semibold mt-6 mb-4">Required Skills</h3>
            <div className="flex flex-wrap gap-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <p>Job not found</p>
        <Button className="mt-4" onClick={() => router.push("/jobs")}>
          Back to Jobs
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Jobs
      </Button>

      <Card className="overflow-hidden rounded-lg shadow-md border border-gray-100">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <div className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2 text-slate-600" />
            <CardTitle className="text-2xl capitalize-words">{capitalizeWords(job.name)}</CardTitle>
          </div>
          <CardDescription className="text-slate-500">Job ID: {job.id}</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <p className="text-gray-600 mb-6">{job.definition}</p>

          <h3 className="text-xl font-semibold mb-4 text-slate-700">Required Skills</h3>
          <div className="flex flex-wrap gap-2 mb-6">
            {skills.map((skill) => {
              const skillIcon = getSkillIcon(skill.type)

              return (
                <Badge
                  key={skill.id}
                  variant="outline"
                  className={`
                    px-3 py-1.5 text-sm cursor-pointer hover:shadow-sm transition-shadow
                    flex items-center rounded-full ${getSkillColorClass(skill.type)}
                  `}
                  onClick={() => handleSkillClick(skill)}
                >
                  {skillIcon}
                  {skill.name}
                  <X className="h-3.5 w-3.5 ml-1.5 opacity-70" />
                </Badge>
              )
            })}
          </div>

          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 border border-purple-200 mr-2">
                <Lightbulb className="h-3 w-3 text-purple-500" />
              </div>
              <span className="text-sm text-slate-600">Hard Skill / Concept</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-100 border border-cyan-200 mr-2">
                <Code className="h-3 w-3 text-cyan-500" />
              </div>
              <span className="text-sm text-slate-600">Technology</span>
            </div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 border border-amber-200 mr-2">
                <User className="h-3 w-3 text-amber-500" />
              </div>
              <span className="text-sm text-slate-600">Soft Skill</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-6 bg-slate-50 border-t border-slate-100">
          <Button className="w-full bg-slate-700 hover:bg-slate-800" onClick={handleGeneratePath}>
            Generate Learning Path
          </Button>
        </CardFooter>
      </Card>

      <SkillDialog skill={selectedSkill} isOpen={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
