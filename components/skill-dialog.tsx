import type { Skill } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Code, Users } from "lucide-react"

interface SkillDialogProps {
  skill: Skill | null
  isOpen: boolean
  onClose: () => void
}

export function SkillDialog({ skill, isOpen, onClose }: SkillDialogProps) {
  if (!skill) return null

  const getSkillIcon = () => {
    switch (skill.type.toLowerCase()) {
      case "hardskill":
        return <BookOpen className="h-5 w-5 text-blue-600" />
      case "concept":
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            {getSkillIcon()}
            <Badge variant="outline" className={`${getSkillColor()} px-2 py-0.5`}>
              {skill.type}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{skill.name}</DialogTitle>
        </DialogHeader>
        <div className="mt-2">
          <p className="text-slate-600">{skill.definition}</p>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Learning Resources</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span>Online courses available</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span>Practice exercises</span>
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
              <span>Recommended reading</span>
            </li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
