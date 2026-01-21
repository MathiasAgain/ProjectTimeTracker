"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download, Clock, Calendar, TrendingUp, DollarSign, CircleDollarSign } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

interface Project {
  id: string
  name: string
  color: string
}

interface ProjectData {
  project: Project
  totalDuration: number
  billableDuration: number
  nonBillableDuration: number
  entryCount: number
}

interface DailyData {
  date: string
  duration: number
}

interface ReportData {
  projectData: ProjectData[]
  dailyData: DailyData[]
  totalDuration: number
  totalBillable: number
  totalNonBillable: number
  totalEntries: number
}

// Date presets
const DATE_PRESETS = [
  { label: "Today", getValue: () => {
    const today = new Date().toISOString().split("T")[0]
    return { start: today, end: today }
  }},
  { label: "This Week", getValue: () => {
    const today = new Date()
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    return { start: weekStart.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
  }},
  { label: "Last 7 Days", getValue: () => {
    const today = new Date()
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 7)
    return { start: weekAgo.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
  }},
  { label: "This Month", getValue: () => {
    const today = new Date()
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    return { start: monthStart.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
  }},
  { label: "Last 30 Days", getValue: () => {
    const today = new Date()
    const monthAgo = new Date(today)
    monthAgo.setDate(today.getDate() - 30)
    return { start: monthAgo.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
  }},
  { label: "Last 90 Days", getValue: () => {
    const today = new Date()
    const ninetyDaysAgo = new Date(today)
    ninetyDaysAgo.setDate(today.getDate() - 90)
    return { start: ninetyDaysAgo.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
  }},
  { label: "This Year", getValue: () => {
    const today = new Date()
    const yearStart = new Date(today.getFullYear(), 0, 1)
    return { start: yearStart.toISOString().split("T")[0], end: today.toISOString().split("T")[0] }
  }},
]

export default function ReportsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(date.getDate() - 30)
    return date.toISOString().split("T")[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split("T")[0]
  })
  const [projectId, setProjectId] = useState<string>("all")

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects")
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }, [])

  const fetchReportData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("startDate", startDate)
      params.set("endDate", endDate)
      if (projectId && projectId !== "all") {
        params.set("projectId", projectId)
      }

      const response = await fetch(`/api/reports?${params}`)
      if (response.ok) {
        const data = await response.json()
        setReportData(data)
      }
    } catch (error) {
      console.error("Error fetching report data:", error)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, projectId])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  useEffect(() => {
    fetchReportData()
  }, [fetchReportData])

  const handleExport = async () => {
    const params = new URLSearchParams()
    params.set("startDate", startDate)
    params.set("endDate", endDate)
    if (projectId && projectId !== "all") {
      params.set("projectId", projectId)
    }

    window.location.href = `/api/reports/export?${params}`
  }

  const pieChartData = reportData?.projectData.map((item) => ({
    name: item.project.name,
    value: item.totalDuration,
    color: item.project.color
  })) || []

  const barChartData = reportData?.dailyData.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    hours: Math.round((item.duration / 3600) * 100) / 100
  })) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Reports</h1>
        <Button onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Date Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {DATE_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  const { start, end } = preset.getValue()
                  setStartDate(start)
                  setEndDate(end)
                }}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
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
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(reportData?.totalDuration || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Billable Time</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatDuration(reportData?.totalBillable || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.totalDuration
                    ? `${Math.round((reportData.totalBillable / reportData.totalDuration) * 100)}% of total`
                    : "0%"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Non-Billable</CardTitle>
                <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-muted-foreground">
                  {formatDuration(reportData?.totalNonBillable || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {reportData?.totalDuration
                    ? `${Math.round((reportData.totalNonBillable / reportData.totalDuration) * 100)}% of total`
                    : "0%"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.totalEntries || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.dailyData.length
                    ? formatDuration(
                        Math.round(
                          (reportData.totalDuration || 0) / reportData.dailyData.length
                        )
                      )
                    : "0:00"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Time by Project (Pie Chart) */}
            <Card>
              <CardHeader>
                <CardTitle>Time by Project</CardTitle>
              </CardHeader>
              <CardContent>
                {pieChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`
                        }
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatDuration(value as number)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Daily Breakdown (Bar Chart) */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {barChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={barChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis
                        fontSize={12}
                        label={{
                          value: "Hours",
                          angle: -90,
                          position: "insideLeft"
                        }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}h`, "Hours"]}
                      />
                      <Legend />
                      <Bar
                        dataKey="hours"
                        fill="hsl(var(--primary))"
                        name="Hours"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Project Breakdown Table */}
          <Card>
            <CardHeader>
              <CardTitle>Project Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {reportData?.projectData.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Project</th>
                        <th className="text-right py-3 px-4">Entries</th>
                        <th className="text-right py-3 px-4">Total</th>
                        <th className="text-right py-3 px-4 text-green-600 dark:text-green-400">Billable</th>
                        <th className="text-right py-3 px-4 text-muted-foreground">Non-Billable</th>
                        <th className="text-right py-3 px-4">% of Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.projectData.map((item) => (
                        <tr key={item.project.id} className="border-b">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: item.project.color }}
                              />
                              {item.project.name}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">
                            {item.entryCount}
                          </td>
                          <td className="text-right py-3 px-4 font-mono">
                            {formatDuration(item.totalDuration)}
                          </td>
                          <td className="text-right py-3 px-4 font-mono text-green-600 dark:text-green-400">
                            {formatDuration(item.billableDuration)}
                          </td>
                          <td className="text-right py-3 px-4 font-mono text-muted-foreground">
                            {formatDuration(item.nonBillableDuration)}
                          </td>
                          <td className="text-right py-3 px-4">
                            {reportData.totalDuration
                              ? `${Math.round(
                                  (item.totalDuration / reportData.totalDuration) *
                                    100
                                )}%`
                              : "0%"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
