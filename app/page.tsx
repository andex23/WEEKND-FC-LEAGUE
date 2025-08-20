import { createServerClient } from "@/lib/supabase/server"
import { RegistrationForm } from "@/components/registration-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"

export default async function HomePage() {
  const supabase = createServerClient()
  let isAuthenticated = false

  if (supabase) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    isAuthenticated = !!session
  }

  const fixturesData = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/fixtures?upcoming=true`,
  )
    .then((res) => (res.ok ? res.json() : { fixtures: [] }))
    .catch(() => ({ fixtures: [] }))

  const upcomingFixtures = fixturesData.fixtures?.slice(0, 6) || []

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">How It Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">⚽</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">1. Register</h3>
              <p className="text-sm text-muted-foreground">Choose your club and join the league</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🎮</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">2. Play</h3>
              <p className="text-sm text-muted-foreground">Complete your weekend fixtures</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl">🏆</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">3. Compete</h3>
              <p className="text-sm text-muted-foreground">Climb the table and win the league</p>
            </div>
          </div>
        </section>

        <Separator className="my-16" />

        <section className="py-16 text-center">
          <h1 className="font-sans text-4xl md:text-6xl font-bold text-gray-900 mb-2">Weeknd FC League</h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-4">FIFA 25</p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8">
            Compete every weekend. Choose your club. Play your fixtures. Climb the table.
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            <Badge variant="secondary" className="px-3 py-1">
              Clubs Only
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Weekend Matches
            </Badge>
            <Badge variant="secondary" className="px-3 py-1">
              Round-Robin
            </Badge>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-md mx-auto">
            <RegistrationForm />
          </div>
        </section>

        <Separator className="my-16" />

        <section className="py-16">
          <Card className="max-w-2xl mx-auto shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">League Rules</CardTitle>
              <CardDescription>
                Official FIFA 25 settings, 6-minute halves, no disconnection tolerance. Fair play and sportsmanship
                expected from all participants.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline">
                <Link href="/rules">Read full rules →</Link>
              </Button>
            </CardContent>
          </Card>
        </section>

        {upcomingFixtures.length > 0 && (
          <>
            <Separator className="my-16" />
            <section className="py-16">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Matchday Ahead</h2>
              </div>

              <Card className="shadow-sm">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {upcomingFixtures.map((fixture) => (
                      <div key={fixture.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium">{fixture.home_player?.name}</span>
                          <span className="text-muted-foreground">vs</span>
                          <span className="text-sm font-medium">{fixture.away_player?.name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          MD {fixture.matchday}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </div>
    </div>
  )
}
