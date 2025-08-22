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

interface SubmitResultDialogProps {
  fixture: {
    id: string
    matchday: number
    homeTeam?: string
    awayTeam?: string
    homePlayer?: string
    awayPlayer?: string
    opponent_name?: string
    opponent_team?: string
    isHome?: boolean
  }
  onSubmitted?: (payload: { fixtureId: string; homeScore: number; awayScore: number }) => void
}

export function SubmitResultDialog({ fixture, onSubmitted }: SubmitResultDialogProps) {
  const [open, setOpen] = useState(false)
  const [homeScore, setHomeScore] = useState("")
  const [awayScore, setAwayScore] = useState("")
  const [playerConfirmed, setPlayerConfirmed] = useState(false)
  const [opponentConfirmed, setOpponentConfirmed] = useState(false)
  const [events, setEvents] = useState("")
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const displayHome = fixture.homeTeam || (fixture.isHome ? fixture.opponent_team : undefined)
  const displayAway = fixture.awayTeam || (!fixture.isHome ? fixture.opponent_team : undefined)
  const displayHomePlayer = fixture.homePlayer
  const displayAwayPlayer = fixture.awayPlayer

  const handleSubmit = async () => {
    if (!playerConfirmed || !opponentConfirmed) return

    setIsSubmitting(true)
    try {
      // Optional: read screenshot as base64 (demo only)
      let screenshotBase64: string | undefined
      if (screenshot) {
        screenshotBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(new Error("Failed to read file"))
          reader.readAsDataURL(screenshot)
        })
      }

      const response = await fetch("/api/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fixtureId: fixture.id,
          homeScore: Number.parseInt(homeScore),
          awayScore: Number.parseInt(awayScore),
          events,
          screenshot: screenshotBase64,
        }),
      })

      if (!response.ok) throw new Error("Failed to submit result")

      onSubmitted?.({ fixtureId: fixture.id, homeScore: Number(homeScore), awayScore: Number(awayScore) })
      setOpen(false)
      setHomeScore("")
      setAwayScore("")
      setPlayerConfirmed(false)
      setOpponentConfirmed(false)
      setEvents("")
      setScreenshot(null)
    } catch (error) {
      console.error("Error submitting result:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">Report score</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report score</DialogTitle>
          <DialogDescription>Matchday {fixture.matchday}</DialogDescription>
        </DialogHeader>

        {/* Score inputs at top */}
        <div className="flex items-end justify-center gap-4 mb-4">
          <div className="text-center">
            <Label htmlFor="homeScore">Home</Label>
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
            <Label htmlFor="awayScore">Away</Label>
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

        {/* Optional events */}
        <div className="space-y-2 mb-2">
          <Label htmlFor="events" className="text-sm">Events (optional)</Label>
          <Input id="events" placeholder="Scorers, assists, cards" value={events} onChange={(e) => setEvents(e.target.value)} />
        </div>

        {/* Screenshot upload */}
        <div className="space-y-2 mb-2">
          <Label htmlFor="screenshot" className="text-sm">Screenshot (optional)</Label>
          <Input id="screenshot" type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
        </div>

        {/* Confirmations */}
        <div className="space-y-3 mt-3">
          <div className="flex items-center space-x-2">
            <Checkbox id="playerConfirm" checked={playerConfirmed} onCheckedChange={(c) => setPlayerConfirmed(c as boolean)} />
            <Label htmlFor="playerConfirm" className="text-sm">I confirm this score is accurate</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="opponentConfirm" checked={opponentConfirmed} onCheckedChange={(c) => setOpponentConfirmed(c as boolean)} />
            <Label htmlFor="opponentConfirm" className="text-sm">My opponent has confirmed this score</Label>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!playerConfirmed || !opponentConfirmed || !homeScore || !awayScore || isSubmitting}
          className="w-full mt-4 bg-primary hover:bg-primary/90"
        >
          {isSubmitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
