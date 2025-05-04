"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import type { Skill, Prerequisite } from "@/lib/types"

interface D3LearningPathGraphProps {
  nodes: Skill[]
  edges: Prerequisite[]
  width?: number
  height?: number
}

export function D3LearningPathGraph({ nodes, edges, width = 600, height = 400 }: D3LearningPathGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; content: string } | null>(null)

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove()

    // Create the SVG container
    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;")

    // Create a force simulation
    const simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(edges)
          .id((d: any) => d.id)
          .distance(100),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(50))

    // Create a container for the graph
    const container = svg.append("g")

    // Add zoom behavior
    svg.call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([0.1, 8])
        .on("zoom", (event) => {
          container.attr("transform", event.transform)
        }) as any,
    )

    // Create the edges
    const link = container
      .append("g")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", 2)
      .attr("marker-end", "url(#arrowhead)")

    // Create arrowhead marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 25)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#999")

    // Create the nodes
    const node = container
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended) as any)
      .on("mouseover", (event, d: Skill) => {
        const [x, y] = d3.pointer(event, svg.node())
        setTooltipData({
          x,
          y,
          content: `${d.name} (${d.type}): ${d.definition || "No definition available"}`,
        })
      })
      .on("mouseout", () => {
        setTooltipData(null)
      })

    // Add circles for nodes
    node
      .append("circle")
      .attr("r", 20)
      .attr("fill", (d: Skill) => {
        switch (d.type.toLowerCase()) {
          case "hardskill":
            return "#93c5fd" // blue-300
          case "technology":
            return "#67e8f9" // cyan-300
          case "softskill":
            return "#fcd34d" // amber-300
          case "concept":
            return "#d8b4fe" // purple-300
          default:
            return "#e5e7eb" // gray-200
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)

    // Add text labels
    node
      .append("text")
      .text((d: Skill) => (d.name.length > 15 ? d.name.substring(0, 15) + "..." : d.name))
      .attr("x", 0)
      .attr("y", 30)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#4b5563") // gray-600

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y)

      node.attr("transform", (d: any) => `translate(${d.x},${d.y})`)
    })

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
    }

    function dragged(event: any, d: any) {
      d.fx = event.x
      d.fy = event.y
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
    }

    return () => {
      simulation.stop()
    }
  }, [nodes, edges, width, height])

  return (
    <div className="relative border rounded-lg p-4 bg-white overflow-hidden">
      <svg ref={svgRef} className="w-full"></svg>

      {tooltipData && (
        <div
          className="absolute bg-white p-2 rounded shadow-md border text-sm max-w-xs z-10"
          style={{
            left: tooltipData.x + 10,
            top: tooltipData.y - 10,
            transform: tooltipData.x > width / 2 ? "translateX(-100%)" : "none",
          }}
        >
          {tooltipData.content}
        </div>
      )}
    </div>
  )
}
