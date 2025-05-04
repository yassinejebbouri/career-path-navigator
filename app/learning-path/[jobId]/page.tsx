"use client"

import { CardContent } from "@/components/ui/card"
import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type NodeTypes,
  Panel,
  MarkerType,
} from "reactflow"
import "reactflow/dist/style.css"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchJobById } from "@/lib/api"
import { getUserSkills } from "@/lib/skills-service"
import type { Job, Skill, LearningPath } from "@/lib/types"
import {
  ArrowLeft,
  Info,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Lightbulb,
  Code,
  Users,
} from "lucide-react"
import SkillNode from "@/components/skill-node"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/lib/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const nodeTypes: NodeTypes = {
  hardskill: SkillNode,
  technology: SkillNode,
  softskill: SkillNode,
  concept: SkillNode,
}

export default function LearningPathPage({ params }: { params: { jobId: string } }) {
  const [job, setJob] = useState<Job | null>(null)
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null)
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<Skill | null>(null)
  const [showPredicted, setShowPredicted] = useState(true)
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0)
  const [requiredSkills, setRequiredSkills] = useState<Skill[]>([])
  const [userSkills, setUserSkills] = useState<Skill[]>([])
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [orphanSkills, setOrphanSkills] = useState<any[]>([])

  const router = useRouter()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { user, isAuthenticated } = useAuth()

  // Function to capitalize first letter of each word
  const capitalizeWords = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase())
  }

  // Function to get consistent skill color classes
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

  // Fetch user skills
  useEffect(() => {
    if (user?.id) {
      const fetchUserSkills = async () => {
        try {
          console.log("Fetching user skills for user ID:", user.id)
          const skills = await getUserSkills(user.id)
          console.log("User skills loaded:", skills)
          setUserSkills(skills)
        } catch (err) {
          console.error("Failed to fetch user skills:", err)
        }
      }

      fetchUserSkills()
    }
  }, [user])

  // Fetch job data and the complete learning path
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login")
      return
    }

    // Only proceed if we have a job ID
    if (!params.jobId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch job details
        const jobData = await fetchJobById(params.jobId)
        setJob(jobData)
        console.log("Job data:", jobData)

        // Get user skills
        let userSkillIds: string[] = []
        if (user?.id) {
          const skills = await getUserSkills(user.id)
          userSkillIds = skills.map((skill) => skill.id)
          setUserSkills(skills)
        }
        

        // Call the Python service
        console.log("Calling Python service for job:", params.jobId)
        const pythonServiceUrl = process.env.NEXT_PUBLIC_PYTHON_SERVICE_URL || "http://localhost:8000"

        try {
          const healthCheck = await fetch(`${pythonServiceUrl}/health`)
          if (!healthCheck.ok) {
            throw new Error("Python service health check failed")
          }
        } catch (healthError) {
          console.error("Python service health check failed:", healthError)
          throw new Error("Python service is not accessible. Please check if the service is running.")
        }

        const response = await fetch(`${pythonServiceUrl}/generate-path`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: params.jobId,
            userSkills: userSkillIds, // Pass user skills to the API
          }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Could not read response text")
          throw new Error(`Python service returned ${response.status}: ${response.statusText}`)
        }

        // Parse response
        let responseData: LearningPath
        try {
          const responseText = await response.text()
          if (!responseText || responseText.trim() === "") {
            throw new Error("Empty response from Python service")
          }
          responseData = JSON.parse(responseText)
          console.log("Python service response:", responseData)
        } catch (e) {
          console.error("Failed to parse response as JSON:", e)
          throw new Error("Invalid response from Python service: not JSON")
        }

        // Check if we have a valid learning path
        if (!responseData.skills || responseData.skills.length === 0) {
          setError("No skills found for this job")
          setLoading(false)
          return
        }

        // Set the learning path data
        setLearningPath(responseData)

        // Extract required skills (those directly related to the job)
        // We'll use these to create individual learning paths
        const jobSkills = responseData.skills.filter((skill) => {
          // Filter criteria: skills that are terminal nodes (not prerequisites for any other skill)
          const isPrerequisiteForOtherSkill = responseData.prerequisites.some((prereq) => prereq.target === skill.id)
          return !isPrerequisiteForOtherSkill
        })

        if (jobSkills.length === 0) {
          // If we couldn't identify terminal skills, use all skills
          setRequiredSkills(responseData.skills)
        } else {
          setRequiredSkills(jobSkills)
        }

        setLoading(false)
      } catch (error) {
        console.error("Failed to fetch learning path:", error)
        setError(error instanceof Error ? error.message : "Failed to generate learning path")
        setLoading(false)
      }
    }

    fetchData()
  }, [params.jobId, isAuthenticated, router, user])

  // Function to create a better layout for learning paths
  const getLayoutedElements = useCallback(
    (nodes: Node[], edges: Edge[]) => {
      // Create a map of nodes by ID for quick lookup
      const nodeMap = new Map(nodes.map((node) => [node.id, node]))

      // Determine node types from data for better layout
      const nodeTypes = new Map<string, string>()
      nodes.forEach((node) => {
        nodeTypes.set(node.id, node.data.type.toLowerCase())
      })

      // Define level for each type
      const typeToLevel: Record<string, number> = {
        concept: 0,
        hardskill: 1,
        technology: 2,
        softskill: 3,
      }

      // Create a base level based on node type
      const baseLevel = new Map<string, number>()
      nodes.forEach((node) => {
        const type = nodeTypes.get(node.id) || "hardskill"
        baseLevel.set(node.id, typeToLevel[type] !== undefined ? typeToLevel[type] : 0)
      })

      // Find root nodes (nodes that are prerequisites but not required by anything)
      const roots = nodes.filter(
        (node) => edges.some((edge) => edge.source === node.id) && !edges.some((edge) => edge.target === node.id),
      )

      // Find leaf nodes (nodes that require prerequisites but aren't prerequisites for anything)
      const leaves = nodes.filter(
        (node) => !edges.some((edge) => edge.source === node.id) && edges.some((edge) => edge.target === node.id),
      )

      // Adjust layout based on the edge directions
      // Create an adjacency list for BFS traversal (skill -> prerequisite)
      const adjacency = new Map<string, string[]>()
      edges.forEach((edge) => {
        if (!adjacency.has(edge.target)) {
          adjacency.set(edge.target, [])
        }
        const prerequisites = adjacency.get(edge.target)
        if (prerequisites) {
          prerequisites.push(edge.source)
        }
      })

      // Adjust levels using BFS from leaf nodes
      const levels = new Map<string, number>(baseLevel)
      const queue: string[] = []

      // Start with leaf nodes for BFS
      if (leaves.length > 0) {
        leaves.forEach((leaf) => {
          queue.push(leaf.id)
        })
      } else if (roots.length > 0) {
        roots.forEach((root) => {
          queue.push(root.id)
        })
      } else {
        // If no clear structure, just use a node of each type as a starting point
        const usedTypes = new Set<string>()
        nodes.forEach((node) => {
          const type = nodeTypes.get(node.id) || "hardskill"
          if (!usedTypes.has(type)) {
            usedTypes.add(type)
            queue.push(node.id)
          }
        })
      }

      // Process queue
      while (queue.length > 0) {
        const current = queue.shift()!
        const currentLevel = levels.get(current) || 0

        const prerequisites = adjacency.get(current) || []
        prerequisites.forEach((prereq) => {
          // Prerequisites should be at a lower level than the skills that require them
          const prereqLevel = levels.get(prereq) || 0
          const newLevel = currentLevel - 1

          if (newLevel < prereqLevel) {
            levels.set(prereq, newLevel)
            queue.push(prereq)
          }
        })
      }

      // Normalize levels to be positive
      const minLevel = Math.min(...Array.from(levels.values()))
      if (minLevel < 0) {
        nodes.forEach((node) => {
          const level = levels.get(node.id) || 0
          levels.set(node.id, level - minLevel)
        })
      }

      // Group nodes by level
      const nodesByLevel = new Map<number, Node[]>()
      nodes.forEach((node) => {
        const level = levels.get(node.id) || 0
        if (!nodesByLevel.has(level)) {
          nodesByLevel.set(level, [])
        }
        const nodesInLevel = nodesByLevel.get(level)
        if (nodesInLevel) {
          nodesInLevel.push(node)
        }
      })

      // Sort nodes within each level by type
      nodesByLevel.forEach((nodesInLevel, level) => {
        nodesInLevel.sort((a, b) => {
          const typeA = a.data.type.toLowerCase()
          const typeB = b.data.type.toLowerCase()
          return (typeToLevel[typeA] || 0) - (typeToLevel[typeB] || 0)
        })
      })

      // Position nodes
      const levelHeight = 180
      const nodeSpacing = 250
      const layoutedNodes = nodes.map((node) => {
        const level = levels.get(node.id) || 0
        const nodesInLevel = nodesByLevel.get(level) || []
        const indexInLevel = nodesInLevel.findIndex((n) => n.id === node.id)

        // Center the nodes in each level
        const totalWidth = (nodesInLevel.length - 1) * nodeSpacing
        const startX = Math.max(400 - totalWidth / 2, 50)

        const x = startX + indexInLevel * nodeSpacing
        const y = 100 + level * levelHeight

        // Check if this is a required skill (end target)
        const isRequired = !edges.some((edge) => edge.source === node.id)

        // Check if this is a skill the user already has
        const userHasSkill = userSkills.some((skill) => skill.id === node.id)

        return {
          ...node,
          position: { x, y },
          data: {
            ...node.data,
            isRequired: isRequired,
            userHasSkill: userHasSkill,
          },
        }
      })

      return { nodes: layoutedNodes, edges }
    },
    [userSkills],
  )

  // Function to generate graph for a specific skill
  const generateGraphForSkill = useCallback(
    (skillId: string) => {
      if (!learningPath) return

      const targetSkill = learningPath.skills.find((s) => s.id === skillId)
      if (!targetSkill) return

      // Create a map of all skills for easy lookup
      const skillMap = new Map(learningPath.skills.map((s) => [s.id, s]))

      // Find all prerequisites related to this skill
      const relevantSkillIds = new Set<string>([skillId])
      const relevantPrereqs = []

      // Find all prerequisites that this skill requires (directly or indirectly)
      let foundNew = true
      while (foundNew) {
        foundNew = false

        for (const prereq of learningPath.prerequisites) {
          // If this prerequisite is for a skill we're already tracking
          if (relevantSkillIds.has(prereq.source) && !relevantSkillIds.has(prereq.target)) {
            relevantSkillIds.add(prereq.target)
            foundNew = true
          }
        }
      }

      // Now get all prerequisites involving our relevant skills
      for (const prereq of learningPath.prerequisites) {
        if (relevantSkillIds.has(prereq.source) && relevantSkillIds.has(prereq.target)) {
          // Only include if we're showing predicted relationships or it's not predicted
          if (showPredicted || !prereq.predicted) {
            relevantPrereqs.push(prereq)
          }
        }
      }

      // Create nodes for the graph
      const graphNodes: Node[] = Array.from(relevantSkillIds).map((id) => {
        const skill = skillMap.get(id)
        if (!skill) {
          // This shouldn't happen, but just in case
          return {
            id,
            type: "hardskill",
            position: { x: 0, y: 0 },
            data: {
              label: id,
              type: "HardSkill",
              definition: "",
              isRequired: id === skillId,
              userHasSkill: userSkills.some((s) => s.id === id),
            },
          }
        }

        return {
          id: skill.id,
          type: skill.type.toLowerCase(),
          position: { x: 0, y: 0 },
          data: {
            label: skill.name,
            type: skill.type,
            definition: skill.definition,
            isRequired: skill.id === skillId,
            userHasSkill: userHasSkill(skill.id),
          },
        }
      })

      // Create edges for the graph
      const graphEdges: Edge[] = relevantPrereqs.map((prereq) => {
        const isPredicted = prereq.predicted === true

        return {
          id: `e-${prereq.target}-${prereq.source}`,
          source: prereq.target, // Prerequisite
          target: prereq.source, // Skill that requires it
          animated: isPredicted,
          style: {
            stroke: isPredicted ? "#94a3b8" : "#64748b",
            strokeWidth: isPredicted ? 1 : 2,
            strokeDasharray: isPredicted ? "5,5" : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 20,
            height: 20,
            color: isPredicted ? "#94a3b8" : "#64748b",
          },
          data: {
            predicted: isPredicted,
            score: prereq.score,
          },
        }
      })

      // Apply layout to position nodes
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(graphNodes, graphEdges)

      // Update the graph
      setNodes(layoutedNodes)
      setEdges(layoutedEdges)
    },
    [learningPath, showPredicted, getLayoutedElements, setNodes, setEdges, userSkills],
  )

  // Update the graph when the current skill changes
  useEffect(() => {
    if (requiredSkills.length > 0 && currentSkillIndex < requiredSkills.length) {
      generateGraphForSkill(requiredSkills[currentSkillIndex].id)
    }
  }, [currentSkillIndex, requiredSkills, generateGraphForSkill])

  // Update graph when showPredicted changes
  useEffect(() => {
    if (requiredSkills.length > 0 && currentSkillIndex < requiredSkills.length) {
      generateGraphForSkill(requiredSkills[currentSkillIndex].id)
    }
  }, [showPredicted, requiredSkills, currentSkillIndex, generateGraphForSkill])

  // Node click handler
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (!learningPath) return

      const skill = learningPath.skills.find((s) => s.id === node.id) || null
      setSelectedNode(skill)
    },
    [learningPath],
  )

  // Navigate to previous skill
  const goToPreviousSkill = () => {
    if (currentSkillIndex > 0) {
      setCurrentSkillIndex(currentSkillIndex - 1)
      setSelectedNode(null)
    }
  }

  // Navigate to next skill
  const goToNextSkill = () => {
    if (currentSkillIndex < requiredSkills.length - 1) {
      setCurrentSkillIndex(currentSkillIndex + 1)
      setSelectedNode(null)
    }
  }

  // Check if user has a skill
  const userHasSkill = (skillId: string) => {
    return userSkills.some((skill) => skill.id === skillId)
  }

  const getSkillClass = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType === "technology") {
      return "skill-badge-technology"
    } else if (lowerType === "softskill") {
      return "skill-badge-softskill"
    } else if (lowerType === "concept") {
      return "skill-badge-concept"
    } else {
      // For HardSkill
      return "skill-badge-hardskill"
    }
  }


  // Get skills the user already has from required skills
  const userRequiredSkills = requiredSkills.filter((skill) => userHasSkill(skill.id))

  // Get skills the user still needs to learn
  const skillsToLearn = requiredSkills.filter((skill) => !userHasSkill(skill.id))

  // Update the pill classes function to use our consistent color scheme
  const pillClasses = (skillType: string, active: boolean, userHas: boolean) => {
    const base = "whitespace-nowrap flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium " +
      "transition-colors duration-150 cursor-pointer select-none focus:outline-none"

    const skillClass = getSkillColorClass(skillType)

    const selected = active ? " ring-2 ring-blue-500 ring-offset-1" : ""
    const hasSkill = userHas ? " ring-2 ring-green-500 ring-offset-1" : ""

    return `${base} ${skillClass}${selected}${hasSkill}`
  }

  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Details
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
          </CardHeader>
        </Card>

        <div className="w-full h-[600px] border rounded-lg bg-gray-50">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto mt-2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Job Details
      </Button>

      <Card className="mb-6 overflow-hidden rounded-lg shadow-md border border-gray-100">
        <CardHeader className="bg-slate-50 border-b border-slate-100">
          <CardTitle>Learning Path For {job ? capitalizeWords(job.name) : ""}</CardTitle>
          <CardDescription className="text-slate-500">
            Individual learning paths for each required skill with their prerequisites
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {requiredSkills.length > 0 ? (
        <>
          {/* Main Title */}
          <h2 className="text-xl font-semibold mb-4">
            Skill {currentSkillIndex + 1} of {requiredSkills.length}: {requiredSkills[currentSkillIndex]?.name}
            {userHasSkill(requiredSkills[currentSkillIndex]?.id) && (
              <span className="ml-2 inline-flex items-center text-green-600 text-sm font-normal">
                <CheckCircle2 className="h-4 w-4 mr-1" /> You already have this skill
              </span>
            )}
          </h2>

          {/* Controls Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Switch id="show-predicted" checked={showPredicted} onCheckedChange={setShowPredicted} />
              <Label htmlFor="show-predicted">Include predicted relationships</Label>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousSkill} disabled={currentSkillIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextSkill}
                disabled={currentSkillIndex === requiredSkills.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Skills Summary Section */}
          <div className="mb-6">
            {/* User Skills Section - Always show this section */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-green-700">Your Skills</CardTitle>
              </CardHeader>
              <CardContent>
                {userSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userSkills.map((skill) => {
                      const skillColorClass = getSkillColorClass(skill.type)
                      let icon = <Lightbulb className="h-3 w-3 mr-2" />

                      if (skill.type.toLowerCase() === "technology") {
                        icon = <Code className="h-3 w-3 mr-2" />
                      } else if (skill.type.toLowerCase() === "softskill") {
                        icon = <Users className="h-3 w-3 mr-2" />
                      } else if (skill.type.toLowerCase() === "concept") {
                        icon = <Lightbulb className="h-3 w-3 mr-2" />
                      }

                      return (
                        <div
                          key={skill.id}
                          className={`px-4 py-2 rounded-full text-sm border ${skillColorClass} flex items-center`}
                          onClick={() => {
                            const index = requiredSkills.findIndex((s) => s.id === skill.id)
                            if (index >= 0) setCurrentSkillIndex(index)
                          }}
                          style={{ cursor: "pointer" }}
                        >
                          {icon}
                          <CheckCircle2 className="h-3 w-3 mr-2 text-green-600" />
                          {skill.name}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    You haven't added any skills yet. Visit the Skills page to add your skills.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Skills To Learn */}
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-blue-700">Skills Left To Learn</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {skillsToLearn.map((skill) => {
                    const skillColorClass = getSkillColorClass(skill.type)
                    let icon = <Lightbulb className="h-3 w-3 mr-2" />

                    if (skill.type.toLowerCase() === "technology") {
                      icon = <Code className="h-3 w-3 mr-2" />
                    } else if (skill.type.toLowerCase() === "softskill") {
                      icon = <Users className="h-3 w-3 mr-2" />
                    } else if (skill.type.toLowerCase() === "concept") {
                      icon = <Lightbulb className="h-3 w-3 mr-2" />
                    }

                    return (
                      <div
                        key={skill.id}
                        className={`px-4 py-2 rounded-full text-sm border ${skillColorClass} flex items-center`}
                        onClick={() => {
                          const index = requiredSkills.findIndex((s) => s.id === skill.id)
                          if (index >= 0) setCurrentSkillIndex(index)
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {icon}
                        {skill.name}
                      </div>
                    )
                  })}
                  {skillsToLearn.length === 0 && (
                    <p className="text-gray-500">You already have all the required skills!</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Navigation */}
          <div className="flex items-center justify-between mb-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="text-sm text-slate-600">
              Viewing skill {currentSkillIndex + 1} of {requiredSkills.length}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={goToPreviousSkill} disabled={currentSkillIndex === 0}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextSkill}
                disabled={currentSkillIndex === requiredSkills.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Current Skill Information Card */}
          <Card className="mb-8 border border-slate-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  {requiredSkills[currentSkillIndex].name}
                  {userHasSkill(requiredSkills[currentSkillIndex].id) && (
                    <span className="text-sm text-green-600 font-normal flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> You already have this skill
                    </span>
                  )}
                </CardTitle>
                <Badge variant="outline" className="text-sm">
                  Type: {requiredSkills[currentSkillIndex].type}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                {requiredSkills[currentSkillIndex].definition || "No definition available"}
              </p>
            </CardContent>
          </Card>

          <div className="w-full h-[600px] border rounded-lg bg-gray-50 shadow-sm" ref={reactFlowWrapper}>
            {nodes.length > 0 ? (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                fitView
              >
                <Controls />
                <Background />

                {selectedNode && (
                  <Panel position="top-right" className="bg-white p-4 rounded-lg shadow-md border w-80">
                    <div className="flex items-start">
                      <Info className="h-5 w-5 mr-2 text-slate-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-lg font-semibold mb-2 text-slate-800">
                          {capitalizeWords(selectedNode.name)}
                          {userHasSkill(selectedNode.id) && (
                            <span className="ml-2 text-sm text-green-600 font-normal flex items-center">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> You have this skill
                            </span>
                          )}
                        </h3>
                        <p className="text-sm">{selectedNode.definition || "No definition available."}</p>
                      </div>
                    </div>
                  </Panel>
                )}
              </ReactFlow>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <p className="text-lg text-gray-500">No learning path available for this skill</p>
                  <p className="text-sm text-gray-400 mt-2">Try selecting a different skill or contact support</p>
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <p className="text-lg text-gray-500">No required skills found for this job</p>
            <p className="text-sm text-gray-400 mt-2">Try selecting a different job or contact support</p>
          </div>
        </div>
      )}

      {/* Update the Legend section to use our consistent color scheme */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-3 text-slate-800">Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-sm font-medium mb-3">Skill Types</h4>
            <div className="flex flex-wrap gap-4 mb-6">
              <div 
                className="px-4 py-2 rounded-md flex items-center min-w-[120px]"
                style={{ 
                  backgroundColor: 'rgb(243 232 255)',
                  color: 'rgb(107 33 168)',
                  border: '1px solid rgb(221 214 254)'
                }}
              >
                <Lightbulb className="h-4 w-4" style={{ color: 'rgb(107 33 168)' }} />
                <span className="ml-2 font-medium text-sm">Hard Skill</span>
              </div>
              <div 
                className="px-4 py-2 rounded-md flex items-center min-w-[120px]"
                style={{ 
                  backgroundColor: 'rgb(207 250 254)',
                  color: 'rgb(22 78 99)',
                  border: '1px solid rgb(165 243 252)'
                }}
              >
                <Code className="h-4 w-4" style={{ color: 'rgb(22 78 99)' }} />
                <span className="ml-2 font-medium text-sm">Technology</span>
              </div>
              <div 
                className="px-4 py-2 rounded-md flex items-center min-w-[120px]"
                style={{ 
                  backgroundColor: 'rgb(254 243 199)',
                  color: 'rgb(146 64 14)',
                  border: '1px solid rgb(253 230 138)'
                }}
              >
                <Users className="h-4 w-4" style={{ color: 'rgb(146 64 14)' }} />
                <span className="ml-2 font-medium text-sm">Soft Skill</span>
              </div>
            </div>
            <h4 className="text-sm font-medium mb-3 mt-6">Skill Status</h4>
            <div className="flex flex-wrap gap-4">
              <div 
                className="px-4 py-2 shadow-md rounded-md flex items-center min-w-[140px]"
                style={{ 
                  backgroundColor: 'rgb(67 56 202)', 
                  color: 'white',
                  border: '2px solid rgb(55 48 163)'
                }}
              >
                <Lightbulb className="h-4 w-4 mr-2" style={{ color: 'white' }} />
                <span className="font-medium text-sm">Required Skill</span>
              </div>
              <div 
                className="px-4 py-2 shadow-md rounded-md flex items-center min-w-[140px]"
                style={{ 
                  backgroundColor: 'rgb(22 163 74)', 
                  color: 'white',
                  border: '2px solid rgb(21 128 61)'
                }}
              >
                <Lightbulb className="h-4 w-4 mr-2" style={{ color: 'white' }} />
                <span className="font-medium text-sm">My Skill</span>
                <CheckCircle2 className="h-4 w-4 ml-1" style={{ color: 'white' }} />
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-3">Relationship Types</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-slate-600 mr-3"></div>
                <span className="text-sm text-slate-600">
                  Actual Prerequisite (A → B means A is prerequisite for B)
                </span>
              </div>
              {showPredicted && (
                <div className="flex items-center">
                  <div className="w-8 h-0.5 bg-slate-400 border-dashed border-t border-slate-400 mr-3"></div>
                  <span className="text-sm text-slate-600">Predicted Prerequisite</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}