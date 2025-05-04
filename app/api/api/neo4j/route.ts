import { NextResponse } from "next/server"
import { runQuery } from "@/lib/neo4j"

export async function GET() {
  try {
    // Test Neo4j connection and get some basic data
    const jobsQuery = "MATCH (j:Job) RETURN j.id as id, j.name as name LIMIT 5"
    const jobsResult = await runQuery(jobsQuery)

    const skillsQuery =
      "MATCH (s) WHERE 'HardSkill' IN labels(s) OR 'SoftSkill' IN labels(s) OR 'Technology' IN labels(s) RETURN s.id as id, s.name as name, labels(s) as type LIMIT 5"
    const skillsResult = await runQuery(skillsQuery)

    const relationshipsQuery = "MATCH (a)-[r:PREREQUISITE_FOR]->(b) RETURN a.id as source, b.id as target LIMIT 5"
    const relationshipsResult = await runQuery(relationshipsQuery)

    return NextResponse.json({
      status: "success",
      message: "Neo4j connection successful",
      data: {
        jobs: jobsResult.map((record) => ({
          id: record.get("id"),
          name: record.get("name"),
        })),
        skills: skillsResult.map((record) => ({
          id: record.get("id"),
          name: record.get("name"),
          type: record.get("type"),
        })),
        relationships: relationshipsResult.map((record) => ({
          source: record.get("source"),
          target: record.get("target"),
        })),
      },
    })
  } catch (error) {
    console.error("Neo4j debug query failed:", error)
    return NextResponse.json(
      {
        status: "error",
        message: "Neo4j connection failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
