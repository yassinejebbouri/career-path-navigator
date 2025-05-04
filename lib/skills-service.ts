import { getFirestore, collection, doc, setDoc, deleteDoc, getDocs, query, where } from "firebase/firestore"
import  app  from "./firebase"
import type { Skill } from "./types"
import { runQuery } from "./neo4j"

// Initialize Firestore
const db = getFirestore(app)

// Get all skills for a user
export async function getUserSkills(userId: string): Promise<Skill[]> {
  try {
    // Step 1: Get skill IDs from Firebase
    const userSkillsRef = collection(db, "user_skills")
    const q = query(userSkillsRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return []
    }

    // Extract skill IDs
    const skillIds = querySnapshot.docs.map((doc) => doc.data().skillId)

    if (skillIds.length === 0) {
      return []
    }

    // Step 2: Get the actual skill details from Neo4j
    const neo4jQuery = `
      MATCH (s)
      WHERE s.id IN $skillIds
      RETURN s.id as id, s.name as name, s.definition as definition, labels(s) as labels
    `

    const records = await runQuery(neo4jQuery, { skillIds })

    return records.map((record) => {
      const labels = record.get("labels")
      let type: "HardSkill" | "SoftSkill" | "Technology" | "Concept" = "HardSkill"

      if (labels.includes("Technology")) {
        type = "Technology"
      } else if (labels.includes("SoftSkill")) {
        type = "SoftSkill"
      } else if (labels.includes("Concept")) {
        type = "Concept"
      }

      return {
        id: record.get("id"),
        name: record.get("name"),
        definition: record.get("definition"),
        type,
      }
    })
  } catch (error) {
    console.error("Error fetching user skills:", error)
    throw error
  }
}

// Add a skill to a user's profile
export async function addUserSkill(userId: string, skill: Skill): Promise<void> {
  try {
    // Create a unique ID for the user-skill combination
    const skillDocId = `${userId}_${skill.id}`

    // Add to Firebase
    await setDoc(doc(db, "user_skills", skillDocId), {
      userId,
      skillId: skill.id,
      skillName: skill.name,
      skillType: skill.type,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error adding user skill:", error)
    throw error
  }
}

// Remove a skill from a user's profile
export async function removeUserSkill(userId: string, skillId: string): Promise<void> {
  try {
    // Delete from Firebase
    const skillDocId = `${userId}_${skillId}`
    await deleteDoc(doc(db, "user_skills", skillDocId))
  } catch (error) {
    console.error("Error removing user skill:", error)
    throw error
  }
}

// Search for skills in Neo4j
export async function searchSkills(query: string): Promise<Skill[]> {
  try {
    console.log("Searching for skills with query:", query)

    if (!query || query.trim().length < 2) {
      console.log("Search query too short, returning empty results")
      return []
    }

    // Simplified search query that should work more reliably
    const searchQuery = `
      MATCH (s)
      WHERE (s:HardSkill OR s:SoftSkill OR s:Technology OR s:Concept)
      AND toLower(s.name) CONTAINS toLower($query)
      RETURN s.id as id, s.name as name, s.definition as definition, labels(s) as labels
      LIMIT 10
    `

    console.log("Executing Neo4j query:", searchQuery)
    const records = await runQuery(searchQuery, { query: query.trim().toLowerCase() })
    console.log(`Found ${records.length} skills matching "${query}"`)

    // If no results with CONTAINS, try a more flexible approach
    if (records.length === 0 && query.trim().length >= 3) {
      console.log("No exact matches, trying partial word search")

      // Try searching for individual words
      const words = query
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length >= 3)

      if (words.length > 0) {
        // Create a query that matches any of the words
        const wordQuery = `
          MATCH (s)
          WHERE (s:HardSkill OR s:SoftSkill OR s:Technology OR s:Concept)
          AND (${words.map((_, i) => `toLower(s.name) CONTAINS $word${i}`).join(" OR ")})
          RETURN s.id as id, s.name as name, s.definition as definition, labels(s) as labels
          LIMIT 10
        `

        // Create parameters for each word
        const params: Record<string, string> = {}
        words.forEach((word, i) => {
          params[`word${i}`] = word
        })

        console.log("Executing word-based query with params:", params)
        const wordRecords = await runQuery(wordQuery, params)
        console.log(`Found ${wordRecords.length} skills with word-based search`)

        if (wordRecords.length > 0) {
          return wordRecords.map(mapRecordToSkill)
        }
      }

      // If still no results, try a very loose search with just the first 3 characters
      if (query.trim().length >= 3) {
        const looseQuery = `
          MATCH (s)
          WHERE (s:HardSkill OR s:SoftSkill OR s:Technology OR s:Concept)
          AND toLower(s.name) CONTAINS $partialQuery
          RETURN s.id as id, s.name as name, s.definition as definition, labels(s) as labels
          LIMIT 10
        `

        console.log("Trying loose search with first 3 characters")
        const looseRecords = await runQuery(looseQuery, { partialQuery: query.trim().toLowerCase().substring(0, 3) })
        console.log(`Found ${looseRecords.length} skills with loose search`)

        return looseRecords.map(mapRecordToSkill)
      }
    }

    return records.map(mapRecordToSkill)
  } catch (error) {
    console.error("Error searching skills:", error)
    throw error
  }
}

// Helper function to map Neo4j record to Skill object
function mapRecordToSkill(record: any): Skill {
  const labels = record.get("labels")
  let type: "HardSkill" | "SoftSkill" | "Technology" | "Concept" = "HardSkill"

  if (labels.includes("Technology")) {
    type = "Technology"
  } else if (labels.includes("SoftSkill")) {
    type = "SoftSkill"
  } else if (labels.includes("Concept")) {
    type = "Concept"
  }

  return {
    id: record.get("id"),
    name: record.get("name"),
    definition: record.get("definition"),
    type,
  }
}
