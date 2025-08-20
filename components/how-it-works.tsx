import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, Trophy } from "lucide-react"

const steps = [
  {
    icon: Users,
    title: "Register & Get Assigned",
    description: "Sign up with your preferred Premier League club and get assigned to a team when the league starts.",
  },
  {
    icon: Calendar,
    title: "Play Your Fixtures",
    description: "Compete in scheduled matches against other players using your assigned Premier League team.",
  },
  {
    icon: Trophy,
    title: "Climb the Table",
    description: "Win matches to earn points and climb the league standings. Top players compete for the championship!",
  },
]

export function HowItWorks() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Join our competitive FIFA 25 league in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="bg-accent/10 p-3 rounded-full">
                    <step.icon className="h-8 w-8 text-accent" />
                  </div>
                </div>
                <CardTitle className="font-heading text-xl">{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">{step.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
