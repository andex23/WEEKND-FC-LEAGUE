"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Users, Calendar, BarChart3, Trophy, Plus, Save, X, XCircle, Clock } from "lucide-react"
import { useState, useEffect } from "react"

export default function AdminDashboard() {
  const [players, setPlayers] = useState([])
  const [standings, setStandings] = useState([])
  const [fixtures, setFixtures] = useState([])
  const [leagueSettings, setLeagueSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      setLoading(true)
      const [playersRes, standingsRes, fixturesRes, settingsRes] = await Promise.all([
        fetch("/api/admin/players"),
        fetch("/api/standings"),
        fetch("/api/fixtures"),
        fetch("/api/league/settings"),
      ])

      const playersData = await playersRes.json()
      const standingsData = await standingsRes.json()
      const fixturesData = await fixturesRes.json()
      const settingsData = await settingsRes.json()

      setPlayers(playersData.players || [])
      setStandings(standingsData.standings || [])
      setFixtures(fixturesData.fixtures || [])
      setLeagueSettings(settingsData.settings || {})
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  const pendingRegistrations = players.filter((player) => player.status === "pending")
  const approvedPlayers = players.filter((player) => player.status === "approved")

  const [pendingFixtures, setPendingFixtures] = useState([])
  const [customFixture, setCustomFixture] = useState({
    homePlayer: "",
    awayPlayer: "",
    date: "",
    time: "",
  })

  const isWeekend = (dateString) => {
    const date = new Date(dateString)
    const day = date.getDay()
    return day === 0 || day === 6 // Sunday = 0, Saturday = 6
  }

  const addCustomFixture = () => {
    console.log("[v0] Adding custom fixture:", customFixture)

    if (!customFixture.homePlayer || !customFixture.awayPlayer || !customFixture.date || !customFixture.time) {
      alert("Please fill in all fields")
      return
    }

    if (customFixture.homePlayer === customFixture.awayPlayer) {
      alert("Home and away players must be different")
      return
    }

    if (!isWeekend(customFixture.date)) {
      alert("Matches can only be scheduled on weekends (Saturday or Sunday)")
      return
    }

    const homePlayerData = approvedPlayers.find((p) => p.id.toString() === customFixture.homePlayer)
    const awayPlayerData = approvedPlayers.find((p) => p.id.toString() === customFixture.awayPlayer)

    const newFixture = {
      id: Date.now(),
      matchday: fixtures.length + pendingFixtures.length + 1,
      date: customFixture.date,
      time: customFixture.time,
      homePlayer: homePlayerData?.name || "Unknown",
      homeTeam: homePlayerData?.preferred_club || "Unknown",
      awayPlayer: awayPlayerData?.name || "Unknown",
      awayTeam: awayPlayerData?.preferred_club || "Unknown",
      homeScore: null,
      awayScore: null,
      status: "scheduled",
    }

    setPendingFixtures([...pendingFixtures, newFixture])
    setCustomFixture({ homePlayer: "", awayPlayer: "", date: "", time: "" })
  }

  const saveAllCustomFixtures = async () => {
    try {
      const response = await fetch("/api/admin/fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fixtures: pendingFixtures }),
      })

      if (response.ok) {
        setFixtures([...fixtures, ...pendingFixtures])
        setPendingFixtures([])
        alert("All fixtures created successfully!")
      } else {
        throw new Error("Failed to create fixtures")
      }
    } catch (err) {
      console.error("Error creating fixtures:", err)
      alert("Failed to create fixtures")
    }
  }

  const generateAllFixtures = async () => {
    try {
      const response = await fetch("/api/admin/generate-fixtures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ format: "double-round-robin" }),
      })

      if (response.ok) {
        const data = await response.json()
        setFixtures(data.fixtures)
        alert(`Generated ${data.fixtures.length} fixtures successfully!`)
      } else {
        throw new Error("Failed to generate fixtures")
      }
    } catch (err) {
      console.error("Error generating fixtures:", err)
      alert("Failed to generate fixtures")
    }
  }

  const approvePlayer = async (playerId) => {
    try {
      const response = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "approve" }),
      })

      if (response.ok) {
        fetchAllData() // Refresh data
      }
    } catch (err) {
      console.error("Error approving player:", err)
    }
  }

  const rejectPlayer = async (playerId) => {
    try {
      const response = await fetch("/api/admin/approve-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, action: "reject" }),
      })

      if (response.ok) {
        fetchAllData() // Refresh data
      }
    } catch (err) {
      console.error("Error rejecting player:", err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchAllData}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Weeknd FC Admin</span>
            </div>
            <Badge className="bg-purple-100 text-purple-800">Admin Dashboard</Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Players</p>
                  <p className="text-2xl font-bold text-gray-900">{players.length}</p>
                </div>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingRegistrations.length}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Fixtures</p>
                  <p className="text-2xl font-bold text-blue-600">{fixtures.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">League Status</p>
                  <p className="text-sm font-bold text-green-600">{leagueSettings?.status || "DRAFT"}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="players">Players</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="stats">Stats</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Registrations Tab */}
          <TabsContent value="registrations">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Pending Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingRegistrations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No pending registrations</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRegistrations.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            {player.psn_name} • {player.console} • {player.preferred_club}
                          </div>
                          <div className="text-xs text-gray-500">{player.location}</div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => approvePlayer(player.id)}
                          >
                            Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => rejectPlayer(player.id)}>
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>Registered Players</CardTitle>
              </CardHeader>
              <CardContent>
                {approvedPlayers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No registered players</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {approvedPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="font-medium">{player.name}</div>
                          <div className="text-sm text-gray-600">
                            {player.psn_name} • {player.console} • {player.preferred_club}
                          </div>
                          <Badge className="bg-green-100 text-green-800 text-xs">Approved</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            Edit
                          </Button>
                          <Button size="sm" variant="outline">
                            Suspend
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 bg-transparent">
                            Remove
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  League Standings
                </CardTitle>
              </CardHeader>
              <CardContent>
                {standings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No standings data available</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Pos</th>
                          <th className="text-left py-2">Player</th>
                          <th className="text-left py-2">Team</th>
                          <th className="text-center py-2">P</th>
                          <th className="text-center py-2">W</th>
                          <th className="text-center py-2">D</th>
                          <th className="text-center py-2">L</th>
                          <th className="text-center py-2">GF</th>
                          <th className="text-center py-2">GA</th>
                          <th className="text-center py-2">GD</th>
                          <th className="text-center py-2">Pts</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing, index) => (
                          <tr key={standing.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 font-medium">
                              {index + 1}
                              {index === 0 && <span className="ml-1">👑</span>}
                            </td>
                            <td className="py-2">{standing.player_name}</td>
                            <td className="py-2">{standing.team}</td>
                            <td className="py-2 text-center">{standing.played}</td>
                            <td className="py-2 text-center">{standing.wins}</td>
                            <td className="py-2 text-center">{standing.draws}</td>
                            <td className="py-2 text-center">{standing.losses}</td>
                            <td className="py-2 text-center">{standing.goals_for}</td>
                            <td className="py-2 text-center">{standing.goals_against}</td>
                            <td className="py-2 text-center">{standing.goal_difference}</td>
                            <td className="py-2 text-center font-bold">{standing.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fixtures Tab */}
          <TabsContent value="fixtures">
            <div className="space-y-6">
              {/* League Creation Section */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>League Creation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Available Players</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        {approvedPlayers.map((player) => (
                          <div key={player.id}>
                            • {player.name} ({player.preferred_club})
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Format Options</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>Double Round-Robin:</strong> Each player plays every other player twice
                        </div>
                        <div className="text-gray-600">
                          Players: {approvedPlayers.length} | Fixtures needed:{" "}
                          {approvedPlayers.length * (approvedPlayers.length - 1)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={generateAllFixtures}
                      disabled={approvedPlayers.length < 2}
                    >
                      Generate All Fixtures
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Create Custom Fixtures */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Create Custom Fixtures</CardTitle>
                  <p className="text-sm text-gray-600">
                    Add multiple fixtures and save them all at once (Weekend matches only)
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="homePlayer">Home Player</Label>
                      <Select
                        value={customFixture.homePlayer}
                        onValueChange={(value) => setCustomFixture({ ...customFixture, homePlayer: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select home player" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedPlayers.map((player) => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              {player.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="awayPlayer">Away Player</Label>
                      <Select
                        value={customFixture.awayPlayer}
                        onValueChange={(value) => setCustomFixture({ ...customFixture, awayPlayer: value })}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select away player" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedPlayers.map((player) => (
                            <SelectItem key={player.id} value={player.id.toString()}>
                              {player.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matchDate">
                        Match Date
                        <br />
                        <span className="text-xs text-gray-500">(Weekend Only)</span>
                      </Label>
                      <Input
                        id="matchDate"
                        type="date"
                        value={customFixture.date}
                        onChange={(e) => setCustomFixture({ ...customFixture, date: e.target.value })}
                        className={`h-12 ${customFixture.date && !isWeekend(customFixture.date) ? "border-red-300 bg-red-50" : ""}`}
                      />
                      {customFixture.date && !isWeekend(customFixture.date) && (
                        <p className="text-xs text-red-600">Please select a weekend date (Saturday or Sunday)</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matchTime">Match Time</Label>
                      <Input
                        id="matchTime"
                        type="time"
                        value={customFixture.time}
                        onChange={(e) => setCustomFixture({ ...customFixture, time: e.target.value })}
                        className="h-12"
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t">
                    <Button onClick={addCustomFixture} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      {pendingFixtures.length === 0 ? "Add Fixture" : "Add More Fixture"}
                    </Button>

                    {pendingFixtures.length > 0 && (
                      <>
                        <Button onClick={saveAllCustomFixtures} className="bg-green-600 hover:bg-green-700">
                          <Save className="h-4 w-4 mr-2" />
                          Create All Fixtures ({pendingFixtures.length})
                        </Button>
                        <Button onClick={() => setPendingFixtures([])} variant="outline">
                          <X className="h-4 w-4 mr-2" />
                          Cancel All
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Pending Fixtures Preview */}
                  {pendingFixtures.length > 0 && (
                    <div className="space-y-4 pt-6 border-t">
                      <h4 className="font-medium">Pending Fixtures ({pendingFixtures.length})</h4>
                      <div className="space-y-3">
                        {pendingFixtures.map((fixture) => (
                          <div key={fixture.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="space-y-1">
                              <div className="text-sm">
                                {fixture.date} at {fixture.time}
                              </div>
                              <div className="font-medium">
                                {fixture.homePlayer} vs {fixture.awayPlayer}
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPendingFixtures(pendingFixtures.filter((f) => f.id !== fixture.id))}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Fixtures */}
              {fixtures.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Current Fixtures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {fixtures.map((fixture) => (
                        <div key={fixture.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600">
                              Matchday {fixture.matchday} • {fixture.date} {fixture.time}
                            </div>
                            <div className="font-medium">
                              {fixture.homePlayer} vs {fixture.awayPlayer}
                            </div>
                            <div className="text-sm text-gray-600">
                              {fixture.homeTeam} vs {fixture.awayTeam}
                            </div>
                            {fixture.status === "completed" && (
                              <div className="text-sm font-medium">
                                Result: {fixture.homeScore} - {fixture.awayScore}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={fixture.status === "completed" ? "default" : "secondary"}>
                              {fixture.status}
                            </Badge>
                            {fixture.status === "scheduled" && (
                              <Button size="sm" variant="outline">
                                Enter Result
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>League Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Statistics dashboard will be available here
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* League Status */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>League Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="league-status">Current Status</Label>
                      <p className="text-sm text-gray-600">Control the league state</p>
                    </div>
                    <Select defaultValue={leagueSettings?.status || "DRAFT"}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DRAFT">Draft</SelectItem>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="COMPLETE">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Season Settings */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Season Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start-date">Season Start Date</Label>
                      <Input id="start-date" type="date" defaultValue={leagueSettings?.start_date} />
                    </div>
                    <div>
                      <Label htmlFor="end-date">Season End Date</Label>
                      <Input id="end-date" type="date" defaultValue={leagueSettings?.end_date} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Competition Format */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Competition Format</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rounds">Number of Rounds</Label>
                      <Input id="rounds" type="number" defaultValue={leagueSettings?.rounds || 2} min="1" max="4" />
                    </div>
                    <div>
                      <Label htmlFor="matchdays">Matchdays per Weekend</Label>
                      <Input
                        id="matchdays"
                        type="number"
                        defaultValue={leagueSettings?.matchdays_per_weekend || 1}
                        min="1"
                        max="3"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Controls */}
              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Registration Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="lock-registrations">Lock New Registrations</Label>
                      <p className="text-sm text-gray-600">Prevent new player registrations</p>
                    </div>
                    <Switch id="lock-registrations" defaultChecked={leagueSettings?.teams_locked} />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button className="bg-purple-600 hover:bg-purple-700">Save Settings</Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
