"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Settings, Play } from "lucide-react"

export function SchedulerTab() {
  const [rounds, setRounds] = useState("2")
  const [matchdaysPerWeekend, setMatchdaysPerWeekend] = useState("2")

  const handleGenerateFixtures = () => {
    // TODO: Implement round-robin fixture generation using circle method
    console.log("Generating fixtures with:", { rounds, matchdaysPerWeekend })
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

          <Button onClick={handleGenerateFixtures} className="w-full bg-accent hover:bg-accent/90">
            <Play className="h-4 w-4 mr-2" />
            Generate League Fixtures (Round-Robin)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
