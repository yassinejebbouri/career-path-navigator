import type { Job, Skill, LearningPath, Prerequisite } from "./types"
import { runQuery } from "./neo4j"

// Fetch all jobs
export async function fetchJobs(): Promise<Job[]> {
  
    const query = `
      MATCH (j:Job)
      RETURN j.id as id, j.name as name, j.definition as definition
    `

    const records = await runQuery(query)

    return records.map((record) => ({
      id: record.get("id"),
      name: record.get("name"),
      definition: record.get("definition"),
    }))
  
  
}

// Fetch a specific job by ID
export async function fetchJobById(id: string): Promise<Job> {
  
    const query = `
      MATCH (j:Job {id: $id})
      RETURN j.id as id, j.name as name, j.definition as definition
    `

    const records = await runQuery(query, { id })

    if (records.length === 0) {
      throw new Error(`Job with ID ${id} not found`)
    }

    const record = records[0]
    return {
      id: record.get("id"),
      name: record.get("name"),
      definition: record.get("definition"),
    }
   
}

// Fetch skills required for a specific job
export async function fetchJobSkills(jobId: string): Promise<Skill[]> {
    const query = `
      MATCH (j:Job {id: $jobId})-[:REQUIRES]->(s)
      RETURN s.id as id, s.name as name, s.definition as definition, 
             labels(s) as labels
    `

    const records = await runQuery(query, { jobId })

    return records.map((record) => {
      const labels = record.get("labels")
      let type: "HardSkill" | "SoftSkill" | "Technology" = "HardSkill"

      // Check for SoftSkill first
      if (labels.includes("SoftSkill")) {
        type = "SoftSkill"
      } 
      // Then check for Technology (which takes precedence over HardSkill)
      else if (labels.includes("Technology")) {
        type = "Technology"
      }
      // Default to HardSkill if it has that label (or Concept+HardSkill)
      else if (labels.includes("HardSkill")) {
        type = "HardSkill"
      }
      // If it's just a Concept with no other labels, treat as HardSkill (default)
      
      return {
        id: record.get("id"),
        name: record.get("name"),
        definition: record.get("definition"),
        type,
      }
    })
}

