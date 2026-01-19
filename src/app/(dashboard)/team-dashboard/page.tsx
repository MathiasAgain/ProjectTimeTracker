"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, Clock, FileText, TrendingUp } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface Project {
  id: string
  name: string
  color: string
}

interface TeamMember {
  userId: string
  name: string
  email: string
  totalDuration: number
  entryCount: number
  projects: Record<string, number>
}

interface TimeEntry {
  id: string
  activity: string | null
  description: string | null
  startTime: string
  duration: number | null
  user: {
    id: string
    name: string | null
    email: string
  }
  project: {
    id: string
    name: string
    color: string
  }
}

interface DashboardData {
  projects: Project[]
  teamMembers: TeamMember[]
  entries: TimeEntry[]
  dateRange: {
    start: string
    end: string
  }
}

export default function TeamDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 7)
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      let url = `/api/team/dashboard?startDate=${startDate}&endDate=${endDate}`
      if (selectedProject !== "all") {
        url += `&projectId=${selectedProject}`
      }
      const res = await fetch(url)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, selectedProject])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!data || data.projects.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              You don&apos;t own any projects yet. Create a project and invite team members to see team activity here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const totalDuration = data.teamMembers.reduce((sum, m) => sum + m.totalDuration, 0)
  const totalEntries = data.teamMembers.reduce((sum, m) => sum + m.entryCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Projects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {data.projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
          />
          <span className="self-center text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
          />
          <Button onClick={fetchData} variant="outline">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalDuration)}</div>
            <p className="text-xs text-muted-foreground">All team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Entries</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
            <p className="text-xs text-muted-foreground">Time entries logged</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.teamMembers.filter(m => m.entryCount > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Active this period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg per Member</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.teamMembers.filter(m => m.entryCount > 0).length > 0
                ? formatDuration(Math.round(totalDuration / data.teamMembers.filter(m => m.entryCount > 0).length))
                : "0h"}
            </div>
            <p className="text-xs text-muted-foreground">Per active member</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Member Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Team Member Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.teamMembers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No team activity in this period
            </p>
          ) : (
            <div className="space-y-4">
              {data.teamMembers
                .sort((a, b) => b.totalDuration - a.totalDuration)
                .map(member => (
                  <div key={member.userId} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium">{member.name}</h3>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatDuration(member.totalDuration)}</div>
                        <p className="text-sm text-muted-foreground">{member.entryCount} entries</p>
                      </div>
                    </div>
                    {totalDuration > 0 && (
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${(member.totalDuration / totalDuration) * 100}%` }}
                        />
                      </div>
                    )}
                    {Object.keys(member.projects).length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {Object.entries(member.projects)
                          .sort((a, b) => b[1] - a[1])
                          .slice(0, 5)
                          .map(([projectId, duration]) => {
                            const project = data.projects.find(p => p.id === projectId)
                            if (!project) return null
                            return (
                              <span
                                key={projectId}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-background rounded"
                              >
                                <div
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}: {formatDuration(duration)}
                              </span>
                            )
                          })}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Team Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.entries.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No entries in this period
            </p>
          ) : (
            <div className="space-y-2">
              {data.entries.slice(0, 20).map(entry => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 p-3 bg-card rounded-lg border"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {entry.activity || entry.description || "Time entry"}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{entry.user.name || entry.user.email}</span>
                      <span>•</span>
                      <span>{entry.project.name}</span>
                      <span>•</span>
                      <span>{new Date(entry.startTime).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="font-mono font-medium">
                    {formatDuration(entry.duration || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
