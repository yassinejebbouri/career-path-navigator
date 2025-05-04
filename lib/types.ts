// Job type
export interface Job {
  id: string
  name: string
  definition: string
}

// Skill type
export interface Skill {
  id: string
  name: string
  type: "HardSkill" | "SoftSkill" | "Technology" | "Concept" | string
  definition: string
}

// Prerequisite relationship with additional attributes
export interface Prerequisite {
  source: string // Skill ID
  target: string // Skill ID
  type?: string // Relationship type (e.g., "REQUIRES")
  predicted?: boolean // Whether this relationship was predicted by AI
  score?: number // Confidence score for predicted relationships
  cost?: number // Cost for dynamic programming
  raw?: number // Raw score
}

// Learning path
export interface LearningPath {
  jobId: string
  skills: Skill[]
  prerequisites: Prerequisite[]
  learningPaths?: Record<
    string,
    {
      nodes: Skill[]
      edges: Prerequisite[]
      status: "already_known" | "has_path" | "orphan"
      recommendations?: Skill[]
    }
  >
  orphans?: Record<
    string,
    {
      skill: Skill
      suggestions: Skill[]
    }
  >
}
