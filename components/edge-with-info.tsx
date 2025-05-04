import { BaseEdge, type EdgeProps, getBezierPath } from "reactflow"

export default function EdgeWithInfo({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style = {},
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  // Apply dashed style for predicted relationships
  const finalStyle = {
    ...style,
    strokeDasharray: data?.predicted ? "5,5" : undefined,
    stroke: data?.predicted ? "#94a3b8" : "#64748b",
    strokeWidth: 2,
  }

  return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={finalStyle} />
}
