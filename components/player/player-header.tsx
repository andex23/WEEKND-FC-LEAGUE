import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Gamepad2, Shield } from "lucide-react"

interface PlayerHeaderProps {
  playerName: string
  console: string
  assignedTeam: string
}

export function PlayerHeader({ playerName, console, assignedTeam }: PlayerHeaderProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-accent/10 p-3 rounded-full">
              <User className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold">{playerName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Gamepad2 className="h-4 w-4" />
                  {console}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  {assignedTeam}
                </div>
              </div>
            </div>
          </div>
          <Badge variant="default" className="bg-accent">
            Player
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
