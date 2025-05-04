"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Code, Users, Lightbulb, Info, Check, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Skill, Prerequisite } from "@/lib/types"
import Link from "next/link"

interface LearningPathVisualizerProps {
  skill: Skill
  allSkills: Skill[]
  prerequisites: Prerequisite[]
}

export function LearningPathVisualizer({ skill, allSkills, prerequisites }: LearningPathVisualizerProps) {
  const [path, setPath] = useState<{
    prerequisites: Skill[]
    current: Skill
    nextSteps: Skill[]
    resources: { title: string; type: string; url: string; isPremium: boolean }[]
    estimatedTime: string
    difficulty: string
  }>({
    prerequisites: [],
    current: skill,
    nextSteps: [],
    resources: [],
    estimatedTime: "",
    difficulty: "",
  })

  useEffect(() => {
    // Find prerequisites for this skill (skills that are sources where this skill is the target)
    const prereqRelations = prerequisites.filter((p) => p.target === skill.id)
    const prereqSkills = prereqRelations
      .map((relation) => allSkills.find((s) => s.id === relation.source))
      .filter(Boolean) as Skill[]

    // Find skills that this skill is a prerequisite for (skills that are targets where this skill is the source)
    const dependentRelations = prerequisites.filter((p) => p.source === skill.id)
    const dependentSkills = dependentRelations
      .map((relation) => allSkills.find((s) => s.id === relation.target))
      .filter(Boolean) as Skill[]

    // Generate learning resources, difficulty, and estimated time based on the skill
    const { resources, difficulty, estimatedTime } = generateLearningInfo(skill)

    console.log(`Setting up learning path for ${skill.name}:`, {
      prerequisites: prereqSkills.map((s) => s.name),
      nextSteps: dependentSkills.map((s) => s.name),
    })

    setPath({
      prerequisites: prereqSkills,
      current: skill,
      nextSteps: dependentSkills,
      resources,
      estimatedTime,
      difficulty,
    })
  }, [skill, allSkills, prerequisites])

  // Generate learning resources, difficulty, and estimated time based on the skill
  const generateLearningInfo = (skill: Skill) => {
    // Determine difficulty based on skill type and complexity of the topic
    let difficulty = "Beginner"
    if (
      skill.type === "HardSkill" &&
      ["machine learning", "computer vision", "algorithms"].some((term) => skill.name.includes(term))
    ) {
      difficulty = "Advanced"
    } else if (
      skill.type === "Technology" &&
      ["tensorflow", "pytorch", "c++"].some((term) => skill.name.includes(term))
    ) {
      difficulty = "Intermediate"
    }

    // Determine estimated time based on difficulty and skill type
    let estimatedTime = "1-2 weeks"
    if (difficulty === "Advanced") {
      estimatedTime = "4-8 weeks"
    } else if (difficulty === "Intermediate") {
      estimatedTime = "2-4 weeks"
    } else if (skill.type === "SoftSkill") {
      estimatedTime = "Ongoing practice"
    }

    // Generate learning resources
    const resources = []

    // Online courses
    if (skill.type === "HardSkill" || skill.type === "Technology") {
      resources.push({
        title: `${skill.name.charAt(0).toUpperCase() + skill.name.slice(1)} Fundamentals Course`,
        type: "Course",
        url: "#",
        isPremium: false,
      })

      resources.push({
        title: `Advanced ${skill.name} Masterclass`,
        type: "Course",
        url: "#",
        isPremium: true,
      })
    }

    // Books and documentation
    if (skill.type === "HardSkill") {
      resources.push({
        title: `Essential ${skill.name} Handbook`,
        type: "Book",
        url: "#",
        isPremium: false,
      })
    } else if (skill.type === "Technology") {
      resources.push({
        title: `Official ${skill.name} Documentation`,
        type: "Documentation",
        url: "#",
        isPremium: false,
      })
    }

    // Practice resources
    resources.push({
      title: `${skill.name} Practice Exercises`,
      type: "Practice",
      url: "#",
      isPremium: false,
    })

    // Community resources
    resources.push({
      title: `${skill.name} Community Forum`,
      type: "Community",
      url: "#",
      isPremium: false,
    })

    // Certifications for professional skills and technologies
    if (skill.type === "HardSkill" || skill.type === "Technology") {
      resources.push({
        title: `${skill.name} Professional Certification`,
        type: "Certification",
        url: "#",
        isPremium: true,
      })
    }

    return { resources, difficulty, estimatedTime }
  }

  // Get icon based on skill type
  const getSkillIcon = (skillType: string) => {
    switch (skillType.toLowerCase()) {
      case "hardskill":
        return <BookOpen className="h-5 w-5 text-blue-600" />
      case "technology":
        return <Code className="h-5 w-5 text-cyan-600" />
      case "softskill":
        return <Users className="h-5 w-5 text-amber-600" />
      case "concept":
        return <Lightbulb className="h-5 w-5 text-purple-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  // Get resource icon based on type
  const getResourceIcon = (resourceType: string) => {
    switch (resourceType.toLowerCase()) {
      case "course":
        return <BookOpen className="h-4 w-4" />
      case "book":
        return <BookOpen className="h-4 w-4" />
      case "documentation":
        return <Info className="h-4 w-4" />
      case "practice":
        return <Check className="h-4 w-4" />
      case "community":
        return <Users className="h-4 w-4" />
      case "certification":
        return <Badge className="h-4 w-4" />
      default:
        return <ExternalLink className="h-4 w-4" />
    }
  }

  // If no relationships, show a modified learning path with just resources
  if (path.prerequisites.length === 0 && path.nextSteps.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              {getSkillIcon(skill.type)}
              <span className="ml-2">Learning Path for {skill.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="flex justify-between mb-4">
                <div>
                  <span className="text-sm text-gray-500">Difficulty:</span>
                  <span className="ml-2 font-medium">{path.difficulty}</span>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Estimated Time:</span>
                  <span className="ml-2 font-medium">{path.estimatedTime}</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">{skill.definition}</p>
            </div>

            <h3 className="text-md font-medium mb-3">Recommended Learning Resources</h3>
            <div className="space-y-3">
              {path.resources.map((resource, index) => (
                <div key={index} className="flex items-start p-3 border rounded-md hover:bg-gray-50">
                  <div className="mr-3 mt-0.5 text-gray-500">{getResourceIcon(resource.type)}</div>
                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{resource.title}</span>
                      {resource.isPremium && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          Premium
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">{resource.type}</div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={resource.url} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Otherwise show the full learning path with prerequisites and next steps
  return (
    <div className="space-y-6">
      {/* Skill Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            {getSkillIcon(skill.type)}
            <span className="ml-2">About {skill.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between mb-4">
            <div>
              <span className="text-sm text-gray-500">Difficulty:</span>
              <span className="ml-2 font-medium">{path.difficulty}</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">Estimated Time:</span>
              <span className="ml-2 font-medium">{path.estimatedTime}</span>
            </div>
          </div>
          <p className="text-sm text-gray-600">{skill.definition}</p>
        </CardContent>
      </Card>

      {/* Full Learning Path */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Path Visualization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative py-10">
            {/* Timeline line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gray-200 z-0 top-0"></div>

            {/* Prerequisites */}
            {path.prerequisites.length > 0 && (
              <div className="relative z-10 mb-12">
                <div className="flex justify-center mb-4">
                  <Badge variant="outline" className="bg-gray-100">
                    Prerequisites
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {path.prerequisites.map((prereq) => (
                    <div
                      key={prereq.id}
                      className={`p-3 border rounded-md skill-badge-${prereq.type.toLowerCase()} flex items-center`}
                    >
                      {getSkillIcon(prereq.type)}
                      <span className="ml-2">{prereq.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center my-4">
                  <ArrowRight className="text-gray-400 transform rotate-90" size={24} />
                </div>
              </div>
            )}

            {/* Current Skill */}
            <div className="relative z-10 mb-12">
              <div className="flex justify-center">
                <div
                  className={`p-4 border-2 rounded-md skill-badge-${skill.type.toLowerCase()} font-medium max-w-xs mx-auto text-center`}
                >
                  <div className="flex justify-center mb-2">{getSkillIcon(skill.type)}</div>
                  <div className="font-bold">{skill.name}</div>
                  <div className="text-xs mt-1">{skill.type}</div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            {path.nextSteps.length > 0 && (
              <div className="relative z-10">
                <div className="flex justify-center my-4">
                  <ArrowRight className="text-gray-400 transform rotate-90" size={24} />
                </div>
                <div className="flex justify-center mb-4">
                  <Badge variant="outline" className="bg-gray-100">
                    Next Steps
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {path.nextSteps.map((next) => (
                    <div
                      key={next.id}
                      className={`p-3 border rounded-md skill-badge-${next.type.toLowerCase()} flex items-center`}
                    >
                      {getSkillIcon(next.type)}
                      <span className="ml-2">{next.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Resources for {skill.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {path.resources.map((resource, index) => (
              <div key={index} className="flex items-start p-3 border rounded-md hover:bg-gray-50">
                <div className="mr-3 mt-0.5 text-gray-500">{getResourceIcon(resource.type)}</div>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{resource.title}</span>
                    {resource.isPremium && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">{resource.type}</div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={resource.url} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Open
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
