"use client"

import { Separator } from "@/components/ui/separator"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

export default function RulesPage() {
  const [activeSection, setActiveSection] = useState("")

  const sections = [
    { id: "structure", title: "Structure" },
    { id: "matchdays", title: "Matchdays" },
    { id: "settings", title: "Match Settings" },
    { id: "disconnects", title: "Disconnects" },
    { id: "results", title: "Results" },
    { id: "standings", title: "Points & Standings" },
    { id: "discipline", title: "Discipline" },
    { id: "no-shows", title: "No-Shows" },
    { id: "awards", title: "Awards" },
  ]

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 120 // Account for sticky header

      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const { offsetTop, offsetHeight } = element
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll() // Set initial active section

    return () => window.removeEventListener("scroll", handleScroll)
  }, [sections])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offsetTop = element.offsetTop - 100 // Account for sticky header
      window.scrollTo({
        top: offsetTop,
        behavior: "smooth",
      })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Navigation */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="w-full overflow-x-auto">
            <div className="flex gap-6 pb-2" style={{ minWidth: "max-content" }}>
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`text-sm whitespace-nowrap transition-colors flex-shrink-0 px-3 py-1 ${
                    activeSection === section.id ? "text-purple-600 font-medium" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Official Rules</h1>
          <p className="text-lg text-gray-600">Weeknd FC League - FIFA 25 Season</p>
        </div>

        <div className="space-y-12">
          {/* Structure */}
          <section id="structure">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Structure</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Format</h3>
                  <p className="text-gray-600 mb-2">Round-robin league:</p>
                  <ul className="text-gray-600 space-y-1 ml-4">
                    <li>• 6–8 players: double round robin (home & away)</li>
                    <li>• 9–12 players: single round robin</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Clubs Only</h3>
                  <p className="text-gray-600">FIFA 25 allows only licensed clubs (no national teams).</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline</h3>
                  <p className="text-gray-600">
                    Season must finish before Sept 26. Players may have 3–4 fixtures per weekend.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Matchdays */}
          <section id="matchdays">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Matchdays</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule</h3>
                  <p className="text-gray-600">Matches are played Saturday and Sunday only.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Kickoff Windows</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Saturday: 14:00–23:00</li>
                    <li>• Sunday: 14:00–23:00</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Expectations</h3>
                  <p className="text-gray-600">Each player should play their scheduled fixtures that weekend.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Match Settings */}
          <section id="settings">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Match Settings</h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Game Settings</h3>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Half length: 6 minutes</li>
                      <li>• Game Speed: Normal</li>
                      <li>• Injuries: Off</li>
                      <li>• Fatigue: On</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Environment</h3>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Weather/Time: Clear, Day or Night (neutral)</li>
                      <li>• Squads: Default, no edits</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Recording Requirement</h3>
                  <p className="text-gray-600">
                    Players must broadcast live, record the match, or take screenshots during gameplay for verification
                    purposes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Disconnects */}
          <section id="disconnects">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Disconnects</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Before 20 Minutes</h3>
                  <p className="text-gray-600">Restart match 0–0 full replay.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">After 20 Minutes</h3>
                  <p className="text-gray-600">
                    Restart match as a new game but keep previous scoreline carried over (e.g. if 2–1 when DC, treat
                    restart as 0–0 but add 2–1 after).
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Chronic Lag</h3>
                  <p className="text-gray-600">Switch host or admin decides.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Results */}
          <section id="results">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Results</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Submission</h3>
                  <p className="text-gray-600">Both players must submit score in the app.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Disputes</h3>
                  <p className="text-gray-600">Screenshot required for disputes (end-game stats screen).</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Optional Tracking</h3>
                  <p className="text-gray-600">Optionally log goals, assists, yellow/red cards.</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Points & Standings */}
          <section id="standings">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Points & Standings</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Points System</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Win = 3 points</li>
                    <li>• Draw = 1 point</li>
                    <li>• Loss = 0 points</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tiebreakers</h3>
                  <p className="text-gray-600">Points → Goal Difference → Goals For → Head-to-Head → Playoff match</p>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Discipline */}
          <section id="discipline">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Discipline</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Pausing</h3>
                  <p className="text-gray-600">Pausing only allowed in your own possession.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Suspensions</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• Red card = 1 match suspension (next fixture)</li>
                    <li>• 5 yellows = 1 match suspension</li>
                    <li>• Suspensions tracked on dashboard</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* No-Shows */}
          <section id="no-shows">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">No-Shows</h2>
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Grace Period</h3>
                  <p className="text-gray-600">15-minute grace period.</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Penalties</h3>
                  <ul className="text-gray-600 space-y-1">
                    <li>• No-show = forfeit 0–3 loss</li>
                    <li>• 3 no-shows = expulsion</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Awards */}
          <section id="awards">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Awards</h2>
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Individual Awards</h3>
                    <ul className="text-gray-600 space-y-1">
                      <li>• League Champion (1st place)</li>
                      <li>• Golden Boot (most goals)</li>
                      <li>• Playmaker (most assists)</li>
                      <li>• Golden Glove (fewest conceded)</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Special Awards</h3>
                    <ul className="text-gray-600 space-y-1">
                      <li>• Fair Play (least cards)</li>
                      <li>• Goal of the Season (community vote)</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            Questions about the rules? Contact an admin or ask in the league chat.
          </p>
        </div>
      </div>
    </div>
  )
}
