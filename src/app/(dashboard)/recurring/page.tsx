"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Play, Pause } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Project {
  id: string
  name: string
  color: string
}

interface RecurringEntry {
  id: string
  name: string
  description: string | null
  duration: number
  billable: boolean
  frequency: "DAILY" | "WEEKLY" | "MONTHLY"
  daysOfWeek: number[]
  dayOfMonth: number | null
  active: boolean
  lastRun: string | null
  project: Project
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function RecurringPage() {
  const { toast } = useToast()
  const [entries, setEntries] = useState<RecurringEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [runningRecurring, setRunningRecurring] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [hours, setHours] = useState("")
  const [minutes, setMinutes] = useState("")
  const [frequency, setFrequency] = useState<"DAILY" | "WEEKLY" | "MONTHLY">("WEEKLY")
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]) // Mon-Fri
  const [dayOfMonth, setDayOfMonth] = useState("1")
  const [projectId, setProjectId] = useState("")
  const [billable, setBillable] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [entriesRes, projectsRes] = await Promise.all([
        fetch("/api/recurring"),
        fetch("/api/projects")
      ])

      if (entriesRes.ok) {
        setEntries(await entriesRes.json())
      }
      if (projectsRes.ok) {
        setProjects(await projectsRes.json())
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    const h = parseInt(hours) || 0
    const m = parseInt(minutes) || 0
    const duration = h * 3600 + m * 60

    if (!name || duration <= 0 || !projectId) return

    const response = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        duration,
        billable,
        frequency,
        daysOfWeek: frequency === "WEEKLY" ? daysOfWeek : [],
        dayOfMonth: frequency === "MONTHLY" ? parseInt(dayOfMonth) : null,
        projectId,
        startDate: new Date().toISOString()
      })
    })

    if (response.ok) {
      fetchData()
      resetForm()
      setShowNew(false)
      toast({
        title: "Recurring entry created",
        description: `"${name}" has been scheduled`,
        variant: "success",
      })
    } else {
      toast({
        title: "Error",
        description: "Failed to create recurring entry",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (entry: RecurringEntry) => {
    const response = await fetch(`/api/recurring/${entry.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entry, active: !entry.active })
    })

    if (response.ok) {
      fetchData()
      toast({
        title: entry.active ? "Entry paused" : "Entry resumed",
        description: `"${entry.name}" has been ${entry.active ? "paused" : "resumed"}`,
      })
    }
  }

  const handleDelete = async (id: string) => {
    const entry = entries.find(e => e.id === id)
    const response = await fetch(`/api/recurring/${id}`, {
      method: "DELETE"
    })

    if (response.ok) {
      setEntries(entries.filter((e) => e.id !== id))
      toast({
        title: "Entry deleted",
        description: entry ? `"${entry.name}" has been removed` : "Recurring entry deleted",
      })
    }
  }

  const handleRunNow = async () => {
    setRunningRecurring(true)
    try {
      const response = await fetch("/api/recurring/run", {
        method: "POST"
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Recurring entries processed",
          description: result.message,
          variant: "success",
        })
        fetchData()
      } else {
        toast({
          title: "Error",
          description: "Failed to run recurring entries",
          variant: "destructive",
        })
      }
    } finally {
      setRunningRecurring(false)
    }
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setHours("")
    setMinutes("")
    setFrequency("WEEKLY")
    setDaysOfWeek([1, 2, 3, 4, 5])
    setDayOfMonth("1")
    setProjectId("")
    setBillable(true)
  }

  const toggleDay = (day: number) => {
    if (daysOfWeek.includes(day)) {
      setDaysOfWeek(daysOfWeek.filter((d) => d !== day))
    } else {
      setDaysOfWeek([...daysOfWeek, day].sort())
    }
  }

  const getFrequencyText = (entry: RecurringEntry) => {
    if (entry.frequency === "DAILY") return "Every day"
    if (entry.frequency === "WEEKLY") {
      const days = entry.daysOfWeek.map((d) => DAYS[d]).join(", ")
      return `Weekly: ${days}`
    }
    return `Monthly: Day ${entry.dayOfMonth}`
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
        <div>
          <h1 className="text-2xl font-bold">Recurring Time Entries</h1>
          <p className="text-muted-foreground">
            Automatically create time entries on a schedule
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRunNow} disabled={runningRecurring}>
            <Play className="mr-2 h-4 w-4" />
            Run Now
          </Button>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Recurring
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No recurring entries yet. Create one to automatically track repetitive tasks.
            </p>
            <Button onClick={() => setShowNew(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Recurring Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id} className={!entry.active ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-3 h-10 rounded"
                      style={{ backgroundColor: entry.project.color }}
                    />
                    <div>
                      <h3 className="font-semibold">{entry.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {entry.project.name} • {formatDuration(entry.duration)}
                        {!entry.billable && " • Non-billable"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {getFrequencyText(entry)}
                      </p>
                      {entry.lastRun && (
                        <p className="text-xs text-muted-foreground">
                          Last run: {new Date(entry.lastRun).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(entry)}
                      title={entry.active ? "Pause" : "Resume"}
                    >
                      {entry.active ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Recurring Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Recurring Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Daily standup"
              />
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details"
              />
            </div>
            <div>
              <Label>Project</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
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
            <div>
              <Label>Duration</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                  className="w-20"
                />
                <span className="text-muted-foreground">h</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="0"
                  className="w-20"
                />
                <span className="text-muted-foreground">m</span>
              </div>
            </div>
            <div>
              <Label>Frequency</Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {frequency === "WEEKLY" && (
              <div>
                <Label>Days of Week</Label>
                <div className="flex gap-1 mt-2">
                  {DAYS.map((day, index) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`w-10 h-10 rounded text-sm font-medium ${
                        daysOfWeek.includes(index)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {frequency === "MONTHLY" && (
              <div>
                <Label>Day of Month</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(e.target.value)}
                  className="w-20"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billable"
                checked={billable}
                onChange={(e) => setBillable(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="billable" className="font-normal">
                Billable
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!name || !projectId || ((!hours || hours === "0") && (!minutes || minutes === "0"))}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
