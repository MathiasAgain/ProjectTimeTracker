import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock, BarChart3, Users, Timer, CheckCircle, Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-lg">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">TimeTracker</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Track Time.
          <br />
          <span className="text-primary">Boost Productivity.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Simple, powerful time tracking for teams. Know where every minute goes
          and make smarter decisions with detailed reports.
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/register">
            <Button size="lg">
              Start Free Trial
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything you need to track time effectively
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Timer className="h-8 w-8" />}
            title="One-Click Timer"
            description="Start and stop tracking with a single click. The timer runs in your browser tab so you always know what's counting."
          />
          <FeatureCard
            icon={<BarChart3 className="h-8 w-8" />}
            title="Detailed Reports"
            description="See where time goes with beautiful charts. Filter by project, date, or team member. Export to CSV anytime."
          />
          <FeatureCard
            icon={<Users className="h-8 w-8" />}
            title="Team Management"
            description="Invite team members, assign them to projects, and view everyone's time entries in one place."
          />
          <FeatureCard
            icon={<CheckCircle className="h-8 w-8" />}
            title="Task Tracking"
            description="Break projects into tasks. Track time against specific tasks to see exactly where effort is spent."
          />
          <FeatureCard
            icon={<Zap className="h-8 w-8" />}
            title="Real-time Updates"
            description="See the timer running in your browser tab. Never lose track of running time entries."
          />
          <FeatureCard
            icon={<Clock className="h-8 w-8" />}
            title="Manual Entry"
            description="Forgot to start the timer? No problem. Add time entries manually with custom dates and durations."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-primary rounded-2xl p-8 md:p-12 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-4">
            Ready to take control of your time?
          </h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">
            Join thousands of teams who use TimeTracker to understand how they
            spend their time and improve productivity.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary rounded-lg">
                <Clock className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">TimeTracker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} TimeTracker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="text-primary mb-4">{icon}</div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
