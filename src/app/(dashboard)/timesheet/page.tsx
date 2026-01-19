"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface TimeEntry {
  id: string
  description: string | null
  startTime: string
  endTime: string | null
  duration: number | null
  billable: boolean
  project: {
    id: string
    name: string
    color: string
  }
}

type ViewMode = "week" | "month"

export default function TimesheetPage() {
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Get start and end of current view period
  const getDateRange = useCallback(() => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (viewMode === "week") {
      // Start of week (Monday)
      const day = start.getDay()
      const diff = start.getDate() - day + (day === 0 ? -6 : 1)
      start.setDate(diff)
      start.setHours(0, 0, 0, 0)

      // End of week (Sunday)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      // Start of month
      start.setDate(1)
      start.setHours(0, 0, 0, 0)

      // End of month
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
    }

    return { start, end }
  }, [currentDate, viewMode])

  // Generate days for the view
  const getDays = useCallback(() => {
    const { start, end } = getDateRange()
    const days: Date[] = []
    const current = new Date(start)

    while (current <= end) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }, [getDateRange])

  const fetchEntries = useCallback(async () => {
    try {
      const { start, end } = getDateRange()
      const response = await fetch(
        `/api/time-entries?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Error fetching entries:", error)
    } finally {
      setLoading(false)
    }
  }, [getDateRange])

  useEffect(() => {
    fetchEntries()
  }, [fetchEntries])

  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Get entries for a specific day
  const getEntriesForDay = (day: Date) => {
    return entries.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return (
        entryDate.getFullYear() === day.getFullYear() &&
        entryDate.getMonth() === day.getMonth() &&
        entryDate.getDate() === day.getDate()
      )
    })
  }

  // Get total duration for a day
  const getDayTotal = (day: Date) => {
    const dayEntries = getEntriesForDay(day)
    return dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
  }

  // Get total for the period
  const getPeriodTotal = () => {
    return entries.reduce((sum, e) => sum + (e.duration || 0), 0)
  }

  // Get billable total
  const getBillableTotal = () => {
    return entries
      .filter((e) => e.billable)
      .reduce((sum, e) => sum + (e.duration || 0), 0)
  }

  const days = getDays()
  const { start, end } = getDateRange()

  // Format header text
  const getHeaderText = () => {
    if (viewMode === "week") {
      const startStr = start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
      const endStr = end.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      return `${startStr} - ${endStr}`
    } else {
      return currentDate.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    }
  }

  const isToday = (day: Date) => {
    const today = new Date()
    return (
      day.getFullYear() === today.getFullYear() &&
      day.getMonth() === today.getMonth() &&
      day.getDate() === today.getDate()
    )
  }

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
        <h1 className="text-2xl font-bold">Timesheet</h1>
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Weekly</SelectItem>
              <SelectItem value="month">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigate("prev")}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => navigate("next")}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            <Calendar className="mr-2 h-4 w-4" />
            Today
          </Button>
        </div>
        <h2 className="text-lg font-semibold">{getHeaderText()}</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(getPeriodTotal())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Billable Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(getBillableTotal())}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Non-Billable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(getPeriodTotal() - getBillableTotal())}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet Grid */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  {days.map((day) => (
                    <th
                      key={day.toISOString()}
                      className={`p-3 text-center min-w-[100px] ${
                        isToday(day) ? "bg-primary/10" : ""
                      }`}
                    >
                      <div className="text-xs text-muted-foreground">
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div
                        className={`text-lg font-semibold ${
                          isToday(day) ? "text-primary" : ""
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Hours row */}
                <tr className="border-b">
                  {days.map((day) => {
                    const total = getDayTotal(day)
                    return (
                      <td
                        key={day.toISOString()}
                        className={`p-3 text-center ${isToday(day) ? "bg-primary/5" : ""}`}
                      >
                        <div
                          className={`text-lg font-bold ${
                            total > 0 ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {formatDuration(total)}
                        </div>
                      </td>
                    )
                  })}
                </tr>
                {/* Entries row */}
                <tr>
                  {days.map((day) => {
                    const dayEntries = getEntriesForDay(day)
                    return (
                      <td
                        key={day.toISOString()}
                        className={`p-2 align-top ${isToday(day) ? "bg-primary/5" : ""}`}
                      >
                        <div className="space-y-1 max-h-[200px] overflow-y-auto">
                          {dayEntries.map((entry) => (
                            <div
                              key={entry.id}
                              className="text-xs p-1.5 rounded border-l-2"
                              style={{ borderColor: entry.project.color }}
                            >
                              <div className="font-medium truncate">
                                {entry.project.name}
                              </div>
                              {entry.description && (
                                <div className="text-muted-foreground truncate">
                                  {entry.description}
                                </div>
                              )}
                              <div className="text-muted-foreground">
                                {formatDuration(entry.duration || 0)}
                                {!entry.billable && " (NB)"}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
