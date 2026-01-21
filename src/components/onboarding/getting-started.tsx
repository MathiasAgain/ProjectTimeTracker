"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FolderPlus,
  Play,
  Clock,
  FileText,
  BarChart3,
  Users,
  CheckCircle2,
  ChevronRight,
  X,
  Sparkles
} from "lucide-react"
import Link from "next/link"

interface GettingStartedProps {
  hasProjects: boolean
  hasEntries: boolean
  onDismiss?: () => void
}

const STEPS = [
  {
    id: "project",
    title: "Create your first project",
    description: "Projects help you organize and categorize your time entries. Start by creating a project for your main work.",
    icon: FolderPlus,
    href: "/projects",
    action: "Create Project"
  },
  {
    id: "timer",
    title: "Start tracking time",
    description: "Use the timer on the dashboard to track time as you work, or add entries manually.",
    icon: Play,
    href: "/dashboard",
    action: "Go to Dashboard"
  },
  {
    id: "entries",
    title: "Review your entries",
    description: "View and edit your time entries in the timesheet view. You can filter by date and project.",
    icon: Clock,
    href: "/timesheet",
    action: "View Timesheet"
  },
  {
    id: "templates",
    title: "Save templates for common tasks",
    description: "Create templates for tasks you do regularly. One click creates a time entry with pre-filled details.",
    icon: FileText,
    href: "/templates",
    action: "Create Template"
  },
  {
    id: "reports",
    title: "Generate reports",
    description: "See where your time goes with detailed reports and charts. Export to CSV for billing or analysis.",
    icon: BarChart3,
    href: "/reports",
    action: "View Reports"
  },
  {
    id: "team",
    title: "Invite your team",
    description: "Create an organization to collaborate with your team. Share projects and view combined time tracking.",
    icon: Users,
    href: "/organization",
    action: "Set Up Organization"
  }
]

export function GettingStarted({ hasProjects, hasEntries, onDismiss }: GettingStartedProps) {
  const [dismissed, setDismissed] = useState(false)

  // Check localStorage for dismissed state
  const checkDismissed = () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("timetracker-onboarding-dismissed") === "true"
    }
    return false
  }

  const handleDismiss = () => {
    localStorage.setItem("timetracker-onboarding-dismissed", "true")
    setDismissed(true)
    onDismiss?.()
  }

  if (dismissed || checkDismissed()) {
    return null
  }

  // Calculate completed steps
  const completedSteps: string[] = []
  if (hasProjects) completedSteps.push("project")
  if (hasEntries) completedSteps.push("timer", "entries")

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            Getting Started
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="h-8 w-8"
            title="Dismiss guide"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Welcome! Follow these steps to get the most out of TimeTracker.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon
            const isCompleted = completedSteps.includes(step.id)

            return (
              <Link
                key={step.id}
                href={step.href}
                className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                  isCompleted
                    ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                    : "bg-muted/50 hover:bg-muted border border-transparent"
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isCompleted
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-background"
                }`}>
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      Step {index + 1}
                    </span>
                    {isCompleted && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        Completed
                      </span>
                    )}
                  </div>
                  <h4 className={`font-medium ${isCompleted ? "text-green-700 dark:text-green-300" : ""}`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-2" />
              </Link>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {completedSteps.length} of {STEPS.length} steps completed
          </p>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Dismiss guide
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
