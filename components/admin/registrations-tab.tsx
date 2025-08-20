"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, UserPlus, Shuffle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Player {
  id: string
  name: string
  location: string
  console: string
  preferred_club: string
  assigned_club: string | null
  role: string
}

export function RegistrationsTab() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlayers()
  }, [])

  const fetchPlayers = async () => {
    try {
      const response = await fetch("/api/admin/players")
      if (response.ok) {
        const data = await response.json()
        setPlayers(data.players || [])
      }
    } catch (error) {
      console.error("Error fetching players:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssignTeams = async () => {
    try {
      const response = await fetch("/api/admin/assign-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Teams assigned successfully!" })
        fetchPlayers() // Refresh the data
      } else {
        toast({ title: "Error", description: "Failed to assign teams", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error assigning teams:", error)
      toast({ title: "Error", description: "Failed to assign teams", variant: "destructive" })
    }
  }

  const handlePromoteToAdmin = async (playerId: string) => {
    try {
      const response = await fetch("/api/admin/promote-player", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId }),
      })

      if (response.ok) {
        toast({ title: "Success", description: "Player promoted to admin!" })
        fetchPlayers() // Refresh the data
      } else {
        toast({ title: "Error", description: "Failed to promote player", variant: "destructive" })
      }
    } catch (error) {
      console.error("Error promoting player:", error)
      toast({ title: "Error", description: "Failed to promote player", variant: "destructive" })
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8">Loading players...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Player Registrations ({players.length})
              </CardTitle>
              <CardDescription>Manage player registrations and team assignments</CardDescription>
            </div>
            <Button onClick={handleAssignTeams} className="bg-accent hover:bg-accent/90">
              <Shuffle className="h-4 w-4 mr-2" />
              Assign Teams
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Console</TableHead>
                <TableHead>Preferred Club</TableHead>
                <TableHead>Assigned Team</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell>{player.location}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{player.console}</Badge>
                  </TableCell>
                  <TableCell>{player.preferred_club}</TableCell>
                  <TableCell>{player.assigned_club || "Not assigned"}</TableCell>
                  <TableCell>
                    <Badge variant={player.role === "ADMIN" ? "default" : "secondary"}>{player.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {player.role === "PLAYER" && (
                      <Button size="sm" variant="outline" onClick={() => handlePromoteToAdmin(player.id)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Promote
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
