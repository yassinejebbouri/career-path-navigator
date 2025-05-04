import { memo } from "react"
import { Handle, Position } from "reactflow"
import { Code, Users, Lightbulb, CheckCircle2, AlertCircle } from "lucide-react"

function SkillNode({ data, isConnectable }: { data: any; isConnectable: boolean }) {
  const { label, type, isRequired, userHasSkill, isOrphan = false, isSuggestion = false } = data

  // Determine node style based on type - using consistent colors
  let nodeStyle: React.CSSProperties = {
    backgroundColor: "rgb(243 232 255)", // purple-100
    color: "rgb(107 33 168)", // purple-800
    border: "1px solid rgb(221 214 254)", // purple-200
  }
  let icon = <Lightbulb className="h-4 w-4" style={{ color: "rgb(107 33 168)" }} />

  if (type?.toLowerCase() === "technology") {
    nodeStyle = {
      backgroundColor: "rgb(207 250 254)", // cyan-100
      color: "rgb(22 78 99)", // cyan-800
      border: "1px solid rgb(165 243 252)", // cyan-200
    }
    icon = <Code className="h-4 w-4" style={{ color: "rgb(22 78 99)" }} />
  } else if (type?.toLowerCase() === "softskill") {
    nodeStyle = {
      backgroundColor: "rgb(254 243 199)", // amber-100
      color: "rgb(146 64 14)", // amber-800
      border: "1px solid rgb(253 230 138)", // amber-200
    }
    icon = <Users className="h-4 w-4" style={{ color: "rgb(146 64 14)" }} />
  } else if (type?.toLowerCase() === "concept") {
    nodeStyle = {
      backgroundColor: "rgb(243 232 255)", // purple-100
      color: "rgb(107 33 168)", // purple-800
      border: "1px solid rgb(221 214 254)", // purple-200
    }
    icon = <Lightbulb className="h-4 w-4" style={{ color: "rgb(107 33 168)" }} />
  }

  // Override for required skills (dark indigo)
  if (isRequired) {
    nodeStyle = {
      backgroundColor: "rgb(67 56 202)", // indigo-600
      color: "white",
      border: "2px solid rgb(55 48 163)", // indigo-700
    }
    if (type?.toLowerCase() === "technology") {
      icon = <Code className="h-4 w-4" style={{ color: "white" }} />
    } else if (type?.toLowerCase() === "softskill") {
      icon = <Users className="h-4 w-4" style={{ color: "white" }} />
    } else {
      icon = <Lightbulb className="h-4 w-4" style={{ color: "white" }} />
    }
  }

  // Override for skills the user already has (dark green)
  if (userHasSkill) {
    nodeStyle = {
      backgroundColor: "rgb(22 163 74)", // green-600
      color: "white",
      border: "2px solid rgb(21 128 61)", // green-700
    }
    if (type?.toLowerCase() === "technology") {
      icon = <Code className="h-4 w-4" style={{ color: "white" }} />
    } else if (type?.toLowerCase() === "softskill") {
      icon = <Users className="h-4 w-4" style={{ color: "white" }} />
    } else {
      icon = <Lightbulb className="h-4 w-4" style={{ color: "white" }} />
    }
  }

  // Update the styling for orphan skills and suggestions to make them more visible

  // Special styling for orphan skills - use dashed border and amber color
  if (isOrphan) {
    nodeStyle = {
      backgroundColor: "rgb(251 191 36)", // amber-400
      color: "white",
      border: `2px dashed rgb(217 119 6)`, // amber-600
      boxShadow: "0 0 8px rgba(251, 191, 36, 0.5)", // Add glow effect
    }
    icon = <AlertCircle className="h-4 w-4" style={{ color: "white" }} />
  }

  // Special styling for suggestion skills - use dotted border and blue color
  if (isSuggestion) {
    nodeStyle = {
      backgroundColor: "rgb(96 165 250)", // blue-400
      color: "white",
      border: `2px dotted rgb(37 99 235)`, // blue-600
      boxShadow: "0 0 8px rgba(96, 165, 250, 0.5)", // Add glow effect
    }
    icon = <Lightbulb className="h-4 w-4" style={{ color: "white" }} />
  }

  return (
    <div className="px-4 py-2 shadow-md rounded-md min-w-[150px] relative group" style={nodeStyle}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="w-2 h-2 bg-gray-400" />
      <div className="flex items-center">
        {icon}
        <div className="ml-2 font-medium text-sm" style={{ color: nodeStyle.color }}>
          {label}
        </div>
        {userHasSkill && <CheckCircle2 className="h-4 w-4 ml-1" style={{ color: "white" }} />}
      </div>
      {isOrphan && (
        <div className="absolute -top-3 -right-3 bg-amber-500 text-white rounded-full p-1.5 w-7 h-7 flex items-center justify-center shadow-md z-10 animate-pulse">
          <AlertCircle size={16} />
        </div>
      )}
      {isSuggestion && (
        <div className="absolute -top-3 -right-3 bg-blue-500 text-white rounded-full p-1.5 w-7 h-7 flex items-center justify-center shadow-md z-10 animate-pulse">
          <Lightbulb size={16} />
        </div>
      )}
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="w-2 h-2 bg-gray-400" />

      {/* Add indicator badges for orphan and suggestion skills - make them larger and more visible */}
      {isOrphan && (
        <div className="absolute -bottom-10 left-0 right-0 bg-amber-100 text-amber-800 text-xs p-1.5 rounded border border-amber-300 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
          Orphan skill - no prerequisites found
        </div>
      )}
      {isSuggestion && (
        <div className="absolute -bottom-10 left-0 right-0 bg-blue-100 text-blue-800 text-xs p-1.5 rounded border border-blue-300 opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none">
          Suggested related skill
        </div>
      )}
    </div>
  )
}

export default memo(SkillNode)
