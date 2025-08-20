import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewTab } from "./overview-tab"
import { RegistrationsTab } from "./registrations-tab"
import { TeamsTab } from "./teams-tab"
import { SchedulerTab } from "./scheduler-tab"
import { FixturesTab } from "./fixtures-tab"
import { StandingsTab } from "./standings-tab"

export function AdminDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">Manage the Weekend Premier League</p>
        </div>

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
