"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Save } from "lucide-react"

interface SubmitResultDialogProps {
  fixture: {
    id: string
    matchday: number
    homeTeam: string
    awayTeam: string
    homePlayer: string
    awayPlayer: string
    isHome: boolean
  }
}

export function SubmitResultDialog({ fixture }: SubmitResultDialogProps) {
  const [homeScore, setHomeScore] = useState("")
  const [awayScore, setAwayScore] = useState("")
  const [playerConfirmed, setPlayerConfirmed] = useState(false)
  const [opponentConfirmed, setOpponentConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!playerConfirmed || !opponentConfirmed) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch("/api/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fixtureId: fixture.id,
          homeScore: Number.parseInt(homeScore),
          awayScore: Number.parseInt(awayScore),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit result")
      }

      console.log("Result submitted successfully")
      // TODO: Close dialog and refresh data
    } catch (error) {
      console.error("Error submitting result:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Trophy className="h-4 w-4 mr-2" />
          Submit Result
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Submit Match Result</DialogTitle>
          <DialogDescription>Enter the final score for Matchday {fixture.matchday}</DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="font-semibold">{fixture.homeTeam}</div>
                <div className="text-sm text-muted-foreground">{fixture.homePlayer}</div>
              </div>
              <div className="text-2xl font-bold text-muted-foreground">VS</div>
              <div className="text-center">
                <div className="font-semibold">{fixture.awayTeam}</div>
                <div className="text-sm text-muted-foreground">{fixture.awayPlayer}</div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="text-center">
                <Label htmlFor="homeScore">Home Score</Label>
                <Input
                  id="homeScore"
                  type="number"
                  min="0"
                  max="20"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-20 text-center"
                />
              </div>
              <div className="text-2xl font-bold">-</div>
              <div className="text-center">
                <Label htmlFor="awayScore">Away Score</Label>
                <Input
                  id="awayScore"
                  type="number"
                  min="0"
                  max="20"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-20 text-center"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="playerConfirm"
                  checked={playerConfirmed}
                  onCheckedChange={(checked) => setPlayerConfirmed(checked as boolean)}
                />
                <Label htmlFor="playerConfirm" className="text-sm">
                  I confirm this result is accurate
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="opponentConfirm"
                  checked={opponentConfirmed}
                  onCheckedChange={(checked) => setOpponentConfirmed(checked as boolean)}
                />
                <Label htmlFor="opponentConfirm" className="text-sm">
                  My opponent has confirmed this result
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!playerConfirmed || !opponentConfirmed || !homeScore || !awayScore || isSubmitting}
              className="w-full mt-6 bg-accent hover:bg-accent/90"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? "Submitting..." : "Submit Result"}
            </Button>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
