"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Code, Users, Lightbulb, Info } from "lucide-react"
import type { Skill } from "@/lib/types"

interface OrphanSkillViewProps {
  skill: Skill
  suggestedSkills: Skill[]
}

export function OrphanSkillView({ skill, suggestedSkills }: OrphanSkillViewProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<Skill | null>(null)

  // Get icon based on skill type
  const getSkillIcon = (skillType: string) => {
    switch (skillType.toLowerCase()) {
      case "hardskill":
        return <BookOpen className="h-5 w-5 text-blue-600" />
      case "technology":
        return <Code className="h-5 w-5 text-cyan-600" />
      case "softskill":
        return <Users className="h-5 w-5 text-amber-600" />
      case "concept":
        return <Lightbulb className="h-5 w-5 text-purple-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  // Get skill color class
  const getSkillColorClass = (skillType: string) => {
    switch (skillType.toLowerCase()) {
      case "hardskill":
        return "bg-blue-50 text-blue-800 border-blue-200"
      case "technology":
        return "bg-cyan-50 text-cyan-800 border-cyan-200"
      case "softskill":
        return "bg-amber-50 text-amber-800 border-amber-200"
      case "concept":
        return "bg-purple-50 text-purple-800 border-purple-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            {getSkillIcon(skill.type)}
            <span className="ml-2">{skill.name}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <p className="text-sm text-gray-600">{skill.definition}</p>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-6">
            <h3 className="text-amber-800 font-medium mb-2 flex items-center">
              <Info className="h-5 w-5 mr-2" />
              No Learning Path Available
            </h3>
            <p className="text-sm text-amber-700">
              This skill doesn't have any prerequisites in our database. We've suggested some related skills below that
              might be helpful to learn alongside this skill.
            </p>
          </div>

          <h3 className="text-md font-medium mb-3">Suggested Related Skills</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedSkills.map((suggestedSkill) => (
              <div
                key={suggestedSkill.id}
                className={`p-3 border rounded-md cursor-pointer hover:shadow-sm transition-shadow ${getSkillColorClass(
                  suggestedSkill.type,
                )}`}
                onClick={() => setSelectedSuggestion(suggestedSkill)}
              >
                <div className="flex items-center">
                  {getSkillIcon(suggestedSkill.type)}
                  <span className="ml-2 font-medium">{suggestedSkill.name}</span>
                </div>
                <div className="mt-1">
                  <Badge variant="outline" className="text-xs">
                    {suggestedSkill.type}
                  </Badge>
                </div>
              </div>
            ))}

            {suggestedSkills.length === 0 && (
              <p className="text-gray-500 col-span-2">No related skills found for this skill.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedSuggestion && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              {getSkillIcon(selectedSuggestion.type)}
              <span className="ml-2">About {selectedSuggestion.name}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{selectedSuggestion.definition}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
