"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AlertCircle } from "lucide-react"
import type { Skill } from "@/lib/types"

interface OrphanSkillSuggestionsProps {
  skill: Skill
  suggestions: any[]
}

export function OrphanSkillSuggestions({ skill, suggestions }: OrphanSkillSuggestionsProps) {
  if (!skill) return null

  return (
    <Card className="border-amber-200 bg-amber-50/30 mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-amber-500" />
          <CardTitle>No Learning Path Available</CardTitle>
        </div>
        <CardDescription>
          <span className="font-medium">{skill.name}</span> is an orphan skill without prerequisites. Here are some
          related skills you might want to learn:
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions && suggestions.length > 0 ? (
          suggestions.map((suggestion) => (
            <div key={suggestion.id} className="bg-white p-3 rounded-md border border-blue-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">{suggestion.name}</p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {suggestion.type}
                  </Badge>
                </div>
                <div className="text-xs text-right">
                  <span className="font-medium">{Math.round((suggestion.score || 0.5) * 100)}%</span>
                  <p className="text-muted-foreground">match</p>
                </div>
              </div>
              <Progress value={(suggestion.score || 0.5) * 100} className="h-1 mt-2" />
              {suggestion.definition && <p className="text-xs text-gray-600 mt-2">{suggestion.definition}</p>}
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">No suggestions available for this skill.</p>
        )}
      </CardContent>
    </Card>
  )
}
