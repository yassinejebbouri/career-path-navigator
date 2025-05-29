import neo4j, { type Driver, type Session } from "neo4j-driver"

let driver: Driver | null = null

export function initNeo4j() {
  try {
    // Replace with your Neo4j connection details
    const uri = process.env.NEO4J_URI
    const user = process.env.NEO4J_USER 
    const password = process.env.NEO4J_PASSWORD 

    driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

    console.log("Neo4j driver initialized")
    return driver
  } catch (error) {
    console.error("Error initializing Neo4j driver:", error)
    throw error
  }
}

export function getDriver(): Driver {
  if (!driver) {
    return initNeo4j()
  }
  return driver
}

export function getSession(): Session {
  return getDriver().session()
}

export async function closeDriver() {
  if (driver) {
    await driver.close()
    driver = null
    console.log("Neo4j driver closed")
  }
}

// Helper function to run a Cypher query
export async function runQuery(cypher: string, params = {}) {
  const session = getSession()
  try {
    const result = await session.run(cypher, params)
    return result.records
  } finally {
    await session.close()
  }
}
