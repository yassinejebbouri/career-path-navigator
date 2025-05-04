import { type NextRequest, NextResponse } from "next/server"
import neo4j from "neo4j-driver"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = Number.parseInt(searchParams.get("limit") || "10")

  try {
    const uri = process.env.NEO4J_URI
    const user = process.env.NEO4J_USER
    const password = process.env.NEO4J_PASSWORD

    if (!uri || !user || !password) {
      return NextResponse.json({ error: "Neo4j environment variables not set" }, { status: 500 })
    }

    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))
    const session = driver.session()

    try {
      // Find skills that have outgoing REQUIRES relationships
      const result = await session.run(
        `MATCH (s:Skill)-[r:REQUIRES]->(other:Skill)
         WITH s, count(r) as outDegree
         RETURN s.name as name, outDegree as score
         ORDER BY outDegree DESC
         LIMIT $limit`,
        { limit: limit },
      )

      const suggestions = result.records.map((record) => ({
        name: record.get("name"),
        score: record.get("score").toNumber() / 10, // Normalize score between 0-1
      }))

      return NextResponse.json({ suggestions })
    } finally {
      await session.close()
      await driver.close()
    }
  } catch (error) {
    console.error("Error fetching skill suggestions:", error)
    return NextResponse.json({ error: "Failed to fetch skill suggestions" }, { status: 500 })
  }
}
