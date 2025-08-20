"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Calendar } from "lucide-react"

interface AvailabilityToggleProps {
  playerId: string
  initialAvailability: boolean
}

export function AvailabilityToggle({ playerId, initialAvailability }: AvailabilityToggleProps) {
  const [available, setAvailable] = useState(initialAvailability)
  const [isUpdating, setIsUpdating] = useState(false)

  const handleToggle = async (checked: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch("/api/player/availability", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerId,
          available: checked,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update availability")
      }

      setAvailable(checked)
    } catch (error) {
      console.error("Error updating availability:", error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calendar className="h-5 w-5 text-purple-600" />
          Availability
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <Label htmlFor="availability" className="text-sm font-medium">
            Available this weekend
          </Label>
          <Switch id="availability" checked={available} onCheckedChange={handleToggle} disabled={isUpdating} />
        </div>
        <p className="text-xs text-gray-500 mt-2">Let others know if you're available to play matches this weekend</p>
      </CardContent>
    </Card>
  )
}
