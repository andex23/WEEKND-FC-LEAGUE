"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Fixture {
  id: string
  matchday: number
  home_club: string
  away_club: string
  home_player: { name: string }
  away_player: { name: string }
  created_at: string
  status: string
}

interface FixturePreviewProps {
  isAuthenticated?: boolean
}

export function FixturePreview({ isAuthenticated = false }: FixturePreviewProps) {
  const [fixtures, setFixtures] = useState<Fixture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    const fetchFixtures = async () => {
      try {
        const response = await fetch("/api/fixtures?limit=2")
        if (response.ok) {
          const data = await response.json()
          setFixtures(data.fixtures || [])
        }
      } catch (error) {
        console.error("Error fetching fixtures:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchFixtures()
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return null
  }

  if (loading) {
    return (
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Upcoming Fixtures</h2>
            <p className="text-muted-foreground">Loading fixtures...</p>
          </div>
        </div>
      </section>
    )
  }

  if (fixtures.length === 0) {
    return (
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Upcoming Fixtures</h2>
            <p className="text-muted-foreground">No fixtures scheduled yet</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="font-heading text-2xl font-bold text-foreground mb-2">Upcoming Fixtures</h2>
          <p className="text-muted-foreground">Preview of this weekend's matches</p>
        </div>

        <div className="grid gap-4">
          {fixtures.map((fixture) => (
            <Card key={fixture.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Badge variant="outline">Matchday {fixture.matchday}</Badge>
                  </div>
                  <Badge variant="secondary">{fixture.status}</Badge>
                </div>

                <div className="mt-4 flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="font-semibold text-lg">{fixture.home_club}</div>
                    <div className="text-sm text-muted-foreground">{fixture.home_player.name}</div>
                  </div>
                  <div className="text-2xl font-bold text-muted-foreground">VS</div>
                  <div className="text-center">
                    <div className="font-semibold text-lg">{fixture.away_club}</div>
                    <div className="text-sm text-muted-foreground">{fixture.away_player.name}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
