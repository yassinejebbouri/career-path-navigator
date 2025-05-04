"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth"
import { getUserSkills, addUserSkill, removeUserSkill, searchSkills } from "@/lib/skills-service"
import type { Skill } from "@/lib/types"
import { X, Plus, BookOpen, Code, Users, Lightbulb, AlertCircle, Search, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/hooks/use-debounce"

export default function SkillsPage() {
  const [userSkills, setUserSkills] = useState<Skill[]>([])
  const [searchResults, setSearchResults] = useState<Skill[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Use debounce to avoid too many search requests
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthenticated, router])

  // Load user skills on mount
  useEffect(() => {
    if (user?.id) {
      loadUserSkills()
    }
  }, [user])

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [])

  // Effect to handle search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim().length >= 2) {
      performSearch(debouncedSearchQuery)
    } else {
      setSearchResults([])
    }
  }, [debouncedSearchQuery])

  // Load user skills from database
  const loadUserSkills = async () => {
    try {
      setLoading(true)
      const skills = await getUserSkills(user?.id as string)
      setUserSkills(skills)
    } catch (err) {
      console.error("Failed to load user skills:", err)
      setError("Failed to load your skills. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Perform search
  const performSearch = async (query: string) => {
    try {
      setSearchLoading(true)
      setError(null)
      console.log("Searching for:", query)
      const results = await searchSkills(query)
      console.log("Search results:", results)

      // Filter out skills the user already has
      const filteredResults = results.filter((result) => !userSkills.some((userSkill) => userSkill.id === result.id))
      setSearchResults(filteredResults)
    } catch (err) {
      console.error("Search failed:", err)
      setError(`Search failed: ${err instanceof Error ? err.message : String(err)}`)
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Add a skill to user's profile
  const handleAddSkill = async (skill: Skill) => {
    try {
      await addUserSkill(user?.id as string, skill)
      setUserSkills([...userSkills, skill])
      // Remove the added skill from search results
      setSearchResults(searchResults.filter((s) => s.id !== skill.id))
    } catch (err) {
      console.error("Failed to add skill:", err)
      setError("Failed to add skill. Please try again.")
    }
  }

  // Remove a skill from user's profile
  const handleRemoveSkill = async (skillId: string) => {
    try {
      await removeUserSkill(user?.id as string, skillId)
      setUserSkills(userSkills.filter((skill) => skill.id !== skillId))
    } catch (err) {
      console.error("Failed to remove skill:", err)
      setError("Failed to remove skill. Please try again.")
    }
  }

  // Get icon based on skill type
  const getSkillIcon = (skillType: string) => {
    switch (skillType.toLowerCase()) {
      case "hardskill":
        return <BookOpen className="h-4 w-4 text-blue-600" />
      case "technology":
        return <Code className="h-4 w-4 text-cyan-600" />
      case "softskill":
        return <Users className="h-4 w-4 text-amber-600" />
      case "concept":
        return <Lightbulb className="h-4 w-4 text-purple-600" />
      default:
        return <BookOpen className="h-4 w-4 text-gray-600" />
    }
  }

  // Get color class based on skill type
  const getSkillColorClass = (skillType: string) => {
    switch (skillType.toLowerCase()) {
      case "hardskill":
        return "bg-blue-100 text-blue-800 border-blue-200"
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

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">My Skills</CardTitle>
          <CardDescription>Manage your skills to get personalized learning paths</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="mb-6">
            <div className="relative">
              <div className="flex items-center border rounded-lg shadow-sm">
                <Search className="absolute left-4 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search for skills to add..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-11"
                />
              </div>

              {/* Search Results */}
              <div className="mt-1 border rounded-lg shadow-sm bg-white">
                {searchLoading && (
                  <div className="py-6 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-gray-500" />
                    <p className="mt-2 text-sm text-gray-600">Searching...</p>
                  </div>
                )}

                {!searchLoading && searchQuery.trim().length >= 2 && searchResults.length === 0 && (
                  <div className="py-6 text-center text-gray-500">No skills found matching '{searchQuery}'</div>
                )}

                {!searchLoading && searchQuery.trim().length < 2 && (
                  <div className="py-6 text-center text-gray-500">Type at least 2 characters to search</div>
                )}

                {!searchLoading && searchResults.length > 0 && (
                  <div className="py-2">
                    <div className="px-3 py-1 text-xs font-medium text-gray-500">Available Skills</div>
                    {searchResults.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleAddSkill(skill)}
                      >
                        {getSkillIcon(skill.type)}
                        <span className="ml-2">{skill.name}</span>
                        <span className="ml-auto text-xs text-gray-500">{skill.type}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="ml-2 h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddSkill(skill)
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Your Skills</h3>
            {loading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-700" />
                <p className="mt-2 text-sm text-gray-600">Loading your skills...</p>
              </div>
            ) : userSkills.length === 0 ? (
              <div className="text-center py-8 border rounded-md bg-gray-50">
                <p className="text-gray-500">You haven't added any skills yet.</p>
                <p className="text-sm text-gray-400 mt-1">Search for skills above to add them to your profile.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userSkills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="outline"
                    className={`px-3 py-1 ${getSkillColorClass(skill.type)} flex items-center gap-1`}
                  >
                    {getSkillIcon(skill.type)}
                    <span>{skill.name}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill.id)}
                      className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                      aria-label={`Remove ${skill.name}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Why Add Skills?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Adding your skills helps us create personalized learning paths that build on what you already know.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Skill Types</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center">
              <BookOpen className="h-4 w-4 text-blue-600 mr-2" />
              <span className="text-sm">Hard Skills: Measurable abilities</span>
            </div>
            <div className="flex items-center">
              <Code className="h-4 w-4 text-cyan-600 mr-2" />
              <span className="text-sm">Technologies: Tools and platforms</span>
            </div>
            <div className="flex items-center">
              <Users className="h-4 w-4 text-amber-600 mr-2" />
              <span className="text-sm">Soft Skills: Interpersonal abilities</span>
            </div>
            <div className="flex items-center">
              <Lightbulb className="h-4 w-4 text-purple-600 mr-2" />
              <span className="text-sm">Concepts: Foundational knowledge</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              After adding your skills, explore job opportunities to see personalized learning paths.
            </p>
            <Button onClick={() => router.push("/jobs")} className="w-full">
              Explore Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
