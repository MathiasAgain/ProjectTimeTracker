"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface TimeEntry {
  id: string
  activity: string | null
  subtask: string | null
  notes: string | null
  description: string | null
  startTime: string
  duration: number | null
  project: {
    id: string
    name: string
    color: string
  }
}

export default function CalendarPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      // Get entries for the current month
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const startDate = new Date(year, month, 1).toISOString()
      const endDate = new Date(year, month + 1, 0).toISOString()

      const res = await fetch(`/api/time-entries/search?startDate=${startDate}&endDate=${endDate}&limit=500`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Error fetching entries:", error)
    } finally {
      setLoading(false)
    }
  }, [currentDate])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get calendar data
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Group entries by date
  const entriesByDate: Record<string, TimeEntry[]> = {}
  entries.forEach(entry => {
    const date = new Date(entry.startTime).toDateString()
    if (!entriesByDate[date]) {
      entriesByDate[date] = []
    }
    entriesByDate[date].push(entry)
  })

  // Generate calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-center text-xl">
            {monthNames[month]} {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Week day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="min-h-24 bg-muted/30 rounded-lg" />
              }

              const date = new Date(year, month, day)
              const dateString = date.toDateString()
              const dayEntries = entriesByDate[dateString] || []
              const totalDuration = dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
              const isToday = isCurrentMonth && today.getDate() === day

              return (
                <div
                  key={day}
                  className={`min-h-24 p-2 rounded-lg border ${
                    isToday ? "border-primary bg-primary/5" : "border-border bg-card"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>
                      {day}
                    </span>
                    {totalDuration > 0 && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(totalDuration)}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {dayEntries.slice(0, 3).map(entry => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-1 text-xs truncate"
                        title={`${entry.activity || entry.description || "Entry"} - ${entry.project.name}`}
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.project.color }}
                        />
                        <span className="truncate">
                          {entry.activity || entry.description || entry.project.name}
                        </span>
                      </div>
                    ))}
                    {dayEntries.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayEntries.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {formatDuration(entries.reduce((sum, e) => sum + (e.duration || 0), 0))}
              </div>
              <p className="text-sm text-muted-foreground">Total Time</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{entries.length}</div>
              <p className="text-sm text-muted-foreground">Time Entries</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {Object.keys(entriesByDate).length}
              </div>
              <p className="text-sm text-muted-foreground">Days Tracked</p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {entries.length > 0
                  ? formatDuration(
                      Math.round(
                        entries.reduce((sum, e) => sum + (e.duration || 0), 0) /
                          Math.max(Object.keys(entriesByDate).length, 1)
                      )
                    )
                  : "0h 0m"}
              </div>
              <p className="text-sm text-muted-foreground">Avg per Day</p>
            </div>
          </div>

          {/* Top projects this month */}
          {entries.length > 0 && (
            <div className="mt-6">
              <h3 className="font-medium mb-3">Top Projects This Month</h3>
              <div className="space-y-2">
                {Object.entries(
                  entries.reduce((acc, entry) => {
                    const projectId = entry.project.id
                    if (!acc[projectId]) {
                      acc[projectId] = {
                        project: entry.project,
                        duration: 0,
                        count: 0
                      }
                    }
                    acc[projectId].duration += entry.duration || 0
                    acc[projectId].count += 1
                    return acc
                  }, {} as Record<string, { project: typeof entries[0]["project"]; duration: number; count: number }>)
                )
                  .sort((a, b) => b[1].duration - a[1].duration)
                  .slice(0, 5)
                  .map(([projectId, data]) => (
                    <div key={projectId} className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: data.project.color }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{data.project.name}</span>
                          <span className="text-muted-foreground">
                            {formatDuration(data.duration)}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: data.project.color,
                              width: `${Math.min(
                                (data.duration /
                                  entries.reduce((sum, e) => sum + (e.duration || 0), 0)) *
                                  100,
                                100
                              )}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
