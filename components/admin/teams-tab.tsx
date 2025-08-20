"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lock, Unlock, Shield } from "lucide-react"
import { PREMIER_LEAGUE_CLUBS } from "@/lib/constants"

export function TeamsTab() {
  const [teamsLocked, setTeamsLocked] = useState(false)

  // Mock assigned teams data
  const assignedTeams = ["Arsenal", "Chelsea", "Liverpool", "Man City", "Man United", "Newcastle", "Spurs", "Brighton"]

  const availableTeams = PREMIER_LEAGUE_CLUBS.filter((club) => !assignedTeams.includes(club))

  const handleToggleLock = () => {
    setTeamsLocked(!teamsLocked)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                League Teams
              </CardTitle>
              <CardDescription>Manage Premier League club assignments</CardDescription>
            </div>
            <Button
              onClick={handleToggleLock}
              variant={teamsLocked ? "destructive" : "default"}
              className={teamsLocked ? "" : "bg-accent hover:bg-accent/90"}
            >
              {teamsLocked ? (
                <>
                  <Unlock className="h-4 w-4 mr-2" />
                  Unlock Teams
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Lock League Teams
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Assigned Teams */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Assigned Teams ({assignedTeams.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {assignedTeams.map((team) => (
                  <Badge key={team} variant="default" className="p-3 justify-center">
                    {team}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Available Teams */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Available Teams ({availableTeams.length})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableTeams.map((team) => (
                  <Badge key={team} variant="outline" className="p-3 justify-center">
                    {team}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Lock Status */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {teamsLocked ? (
                  <Lock className="h-4 w-4 text-destructive" />
                ) : (
                  <Unlock className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium">Teams are {teamsLocked ? "locked" : "unlocked"}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {teamsLocked
                  ? "No duplicate team assignments allowed. Players must use unique Premier League clubs."
                  : "Players can be assigned to any available Premier League club, including duplicates."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
