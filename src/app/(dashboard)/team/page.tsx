"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Clock, DollarSign, TrendingUp } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface Project {
  id: string
  name: string
  color: string
  memberCount: number
}

interface Member {
  id: string
  name: string | null
  email: string
  projects: { id: string; name: string; color: string }[]
  stats: {
    totalSeconds: number
    billableSeconds: number
  }
}

interface RecentEntry {
  id: string
  description: string | null
  startTime: string
  duration: number | null
  billable: boolean
  user: { id: string; name: string | null; email: string }
  project: { id: string; name: string; color: string }
}

interface TeamData {
  projects: Project[]
  members: Member[]
  recentEntries: RecentEntry[]
  summary: {
    totalHours: number
    billableHours: number
    totalValue: number
  }
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0])

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/team?startDate=${startDate}&endDate=${endDate}`
      )
      if (response.ok) {
        setData(await response.json())
      }
    } catch (error) {
      console.error("Error fetching team data:", error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate])

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
            <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No team projects yet</h3>
            <p className="text-muted-foreground">
              Create a project and invite team members to see their activity here.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Team Dashboard</h1>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-auto"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-auto"
          />
          <Button variant="outline" onClick={fetchData}>
            Apply
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalHours.toFixed(1)}h</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.billableHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground">
              {data.summary.totalHours > 0
                ? Math.round((data.summary.billableHours / data.summary.totalHours) * 100)
                : 0}
              % of total
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Billable Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${data.summary.totalValue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.members.length}</div>
            <p className="text-xs text-muted-foreground">
              across {data.projects.length} projects
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team Members */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            {data.members.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No team members yet
              </p>
            ) : (
              <div className="space-y-4">
                {data.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {member.name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{member.name || member.email}</p>
                        <div className="flex gap-1 mt-1">
                          {member.projects.slice(0, 3).map((project) => (
                            <div
                              key={project.id}
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: project.color }}
                              title={project.name}
                            />
                          ))}
                          {member.projects.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{member.projects.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatDuration(member.stats.totalSeconds)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDuration(member.stats.billableSeconds)} billable
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {data.recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div
                      className="w-2 h-full min-h-[40px] rounded"
                      style={{ backgroundColor: entry.project.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {entry.description || entry.project.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {entry.user.name || entry.user.email} • {entry.project.name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDuration(entry.duration || 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.startTime).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
