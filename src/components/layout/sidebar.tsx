"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Clock,
  LayoutDashboard,
  FolderKanban,
  BarChart3,
  Settings,
  Menu,
  X,
  CalendarDays,
  Users,
  Repeat,
  FileText,
  Calendar,
  UsersRound,
  Building2
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Overview of your time tracking, stats, and quick timer"
  },
  {
    name: "Timesheet",
    href: "/timesheet",
    icon: CalendarDays,
    description: "View and manage your weekly timesheet entries"
  },
  {
    name: "Calendar",
    href: "/calendar",
    icon: Calendar,
    description: "See your time entries in a monthly calendar view"
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderKanban,
    description: "Create and manage your projects"
  },
  {
    name: "Templates",
    href: "/templates",
    icon: FileText,
    description: "Save time entry templates for quick reuse"
  },
  {
    name: "Recurring",
    href: "/recurring",
    icon: Repeat,
    description: "Set up automatic recurring time entries"
  },
  {
    name: "Organization",
    href: "/organization",
    icon: Building2,
    description: "Manage your team and organization settings"
  },
  {
    name: "Team Dashboard",
    href: "/team-dashboard",
    icon: UsersRound,
    description: "View your team's time tracking activity"
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
    description: "Generate reports and analyze your time data"
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Configure your account and app preferences"
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-card border-r transition-transform md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2 p-6 border-b">
            <div className="p-2 bg-primary rounded-lg">
              <Clock className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-lg">TimeTracker</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <TooltipProvider delayDuration={300}>
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.name}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[200px]">
                      <p>{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </nav>
        </div>
      </aside>
    </>
  )
}
