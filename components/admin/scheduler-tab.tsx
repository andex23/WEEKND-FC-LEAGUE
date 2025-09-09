"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Settings, Play, Loader2 } from "lucide-react"
import { toast } from "sonner"

export function SchedulerTab() {
  const [rounds, setRounds] = useState("2")
  const [matchdaysPerWeekend, setMatchdaysPerWeekend] = useState("2")
  const [generating, setGenerating] = useState(false)

  const handleGenerateFixtures = async () => {
    try {
      setGenerating(true)
      
      const response = await fetch("/api/admin/generate-fixtures", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rounds: parseInt(rounds),
          matchdaysPerWeekend: parseInt(matchdaysPerWeekend),
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        const errorMessage = result.message || result.error || "Failed to generate fixtures"
        const suggestion = result.suggestion || ""
        throw new Error(`${errorMessage}${suggestion ? ` - ${suggestion}` : ""}`)
      }

      const fixtureCount = result.fixtures?.length || 0
      toast.success(`Successfully generated ${fixtureCount} fixtures!`)
      
      // Refresh the page to show new fixtures
      window.location.reload()
    } catch (error) {
      console.error("Error generating fixtures:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate fixtures"
      toast.error(errorMessage)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Fixture Scheduler
          </CardTitle>
          <CardDescription>Generate league fixtures using round-robin format</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rounds">Number of Rounds</Label>
              <Select value={rounds} onValueChange={setRounds}>
                <SelectTrigger>
                  <SelectValue placeholder="Select rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Round (Single)</SelectItem>
                  <SelectItem value="2">2 Rounds (Home & Away)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {rounds === "1" ? "Each team plays every other team once" : "Each team plays every other team twice"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="matchdays">Matchdays per Weekend</Label>
              <Select value={matchdaysPerWeekend} onValueChange={setMatchdaysPerWeekend}>
                <SelectTrigger>
                  <SelectValue placeholder="Select matchdays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Matchday</SelectItem>
                  <SelectItem value="2">2 Matchdays</SelectItem>
                  <SelectItem value="3">3 Matchdays</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">How many matchdays to schedule per weekend</p>
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Fixture Generation Settings</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Uses circle method for balanced round-robin scheduling</li>
              <li>• Ensures equal home/away distribution</li>
              <li>• Automatically schedules fixtures across weekends</li>
              <li>• Prevents team conflicts on same matchday</li>
            </ul>
          </div>

          <Button 
            onClick={handleGenerateFixtures} 
            disabled={generating}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            {generating ? "Generating Fixtures..." : "Generate League Fixtures (Round-Robin)"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
