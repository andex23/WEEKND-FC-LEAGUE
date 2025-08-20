import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle } from "lucide-react"
import { OverviewTab } from "@/components/admin/overview-tab"
import { RegistrationsTab } from "@/components/admin/registrations-tab"
import { TeamsTab } from "@/components/admin/teams-tab"
import { SchedulerTab } from "@/components/admin/scheduler-tab"
import { FixturesTab } from "@/components/admin/fixtures-tab"
import { StandingsTab } from "@/components/admin/standings-tab"
import { getPlayerByUserId } from "@/lib/supabase/queries"

export default async function AdminDashboard() {
  const supabase = createServerClient()

  if (!supabase) {
    redirect("/auth/login")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const player = await getPlayerByUserId(user.id)
  const isAdmin = player?.role === "ADMIN"

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You need admin privileges to access this page.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-accent" />
            <h1 className="font-heading text-3xl font-bold">Admin Dashboard</h1>
            <Badge variant="default">ADMIN</Badge>
          </div>
          <p className="text-muted-foreground">Manage the Weekend Premier League - FIFA 25 community tournament</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="scheduler">Scheduler</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="standings">Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <OverviewTab />
          </TabsContent>

          <TabsContent value="registrations">
            <RegistrationsTab />
          </TabsContent>

          <TabsContent value="teams">
            <TeamsTab />
          </TabsContent>

          <TabsContent value="scheduler">
            <SchedulerTab />
          </TabsContent>

          <TabsContent value="fixtures">
            <FixturesTab />
          </TabsContent>

          <TabsContent value="standings">
            <StandingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
