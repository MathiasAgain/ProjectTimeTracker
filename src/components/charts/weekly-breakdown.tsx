"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDuration } from "@/lib/utils"
import { BarChart3 } from "lucide-react"

interface TimeEntry {
  startTime: Date | string
  duration: number | null
}

interface WeeklyBreakdownProps {
  entries: TimeEntry[]
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export function WeeklyBreakdown({ entries }: WeeklyBreakdownProps) {
  const { dailyData, maxHours } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())

    // Initialize daily totals for each day of the week
    const dailyTotals = Array(7).fill(0)

    entries.forEach(entry => {
      const entryDate = new Date(entry.startTime)
      entryDate.setHours(0, 0, 0, 0)

      // Check if entry is within current week
      if (entryDate >= weekStart && entryDate <= today) {
        const dayOfWeek = entryDate.getDay()
        dailyTotals[dayOfWeek] += entry.duration || 0
      }
    })

    // Convert to hours for display
    const dailyData = dailyTotals.map((seconds, index) => ({
      day: DAYS[index],
      seconds,
      hours: seconds / 3600,
      isToday: index === today.getDay(),
      isPast: index < today.getDay()
    }))

    const maxSeconds = Math.max(...dailyTotals, 3600) // Minimum 1 hour for scale
    const maxHours = maxSeconds / 3600

    return { dailyData, maxHours }
  }, [entries])

  const totalWeekSeconds = dailyData.reduce((sum, d) => sum + d.seconds, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Weekly Breakdown</CardTitle>
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">{formatDuration(totalWeekSeconds)}</div>

        {/* Chart */}
        <div className="flex items-end justify-between gap-1 h-32">
          {dailyData.map((day) => {
            const heightPercent = maxHours > 0 ? (day.hours / maxHours) * 100 : 0

            return (
              <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                {/* Bar */}
                <div className="w-full flex flex-col items-center justify-end h-24">
                  {day.seconds > 0 && (
                    <span className="text-xs text-muted-foreground mb-1">
                      {day.hours >= 1 ? `${day.hours.toFixed(1)}h` : `${Math.round(day.seconds / 60)}m`}
                    </span>
                  )}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      day.isToday
                        ? "bg-primary"
                        : day.isPast && day.seconds > 0
                        ? "bg-primary/60"
                        : "bg-muted"
                    }`}
                    style={{
                      height: `${Math.max(heightPercent, day.seconds > 0 ? 8 : 2)}%`,
                      minHeight: day.seconds > 0 ? '8px' : '2px'
                    }}
                  />
                </div>
                {/* Day label */}
                <span className={`text-xs ${
                  day.isToday
                    ? "font-bold text-primary"
                    : "text-muted-foreground"
                }`}>
                  {day.day}
                </span>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary" />
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/60" />
            <span>Previous days</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
