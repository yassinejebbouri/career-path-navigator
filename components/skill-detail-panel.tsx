"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Code, Users, X } from "lucide-react"
import type { Skill } from "@/lib/types"

interface SkillDetailPanelProps {
  skill: Skill
  onClose: () => void
}

export function SkillDetailPanel({ skill, onClose }: SkillDetailPanelProps) {
  const getSkillIcon = () => {
    switch (skill.type.toLowerCase()) {
      case "hardskill":
        return <BookOpen className="h-5 w-5 text-blue-600" />
      case "technology":
        return <Code className="h-5 w-5 text-cyan-600" />
      case "softskill":
        return <Users className="h-5 w-5 text-amber-600" />
      default:
        return <BookOpen className="h-5 w-5" />
    }
  }

  const getSkillColor = () => {
    switch (skill.type.toLowerCase()) {
      case "hardskill":
        return "bg-blue-50 border-blue-200 text-blue-700"
      case "technology":
        return "bg-cyan-50 border-cyan-200 text-cyan-700"
      case "softskill":
        return "bg-amber-50 border-amber-200 text-amber-700"
      default:
        return "bg-gray-100 border-gray-300 text-gray-800"
    }
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="pb-2 flex flex-row justify-between items-start">
        <div className="flex items-center gap-2">
          {getSkillIcon()}
          <Badge variant="outline" className={`${getSkillColor()} px-2 py-0.5`}>
            {skill.type}
          </Badge>
        </div>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition-colors" aria-label="Close">
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-2 text-slate-800">{skill.name}</h3>
        <p className="text-sm text-slate-600 mb-4">{skill.definition}</p>

        <div className="pt-3 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Learning Resources</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span>Online courses</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span>Practice exercises</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span>Documentation</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
