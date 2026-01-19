"use client"

import { useEffect, useState, useCallback } from "react"
import { Timer } from "@/components/timer/timer"
import { TimeEntryList } from "@/components/time-entry/time-entry-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Clock, FolderPlus, TrendingUp, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatDuration } from "@/lib/utils"

interface Project {
  id: string
  name: string
  color: string
}

interface TimeEntry {
  id: string
  description: string | null
  startTime: Date
  endTime: Date | null
  duration: number | null
  projectId: string
  project: {
    id: string
    name: string
    color: string
  }
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [showNewProject, setShowNewProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState("")
  const [newProjectColor, setNewProjectColor] = useState("#3B82F6")

  // Manual entry state
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualProjectId, setManualProjectId] = useState("")
  const [manualDescription, setManualDescription] = useState("")
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split("T")[0])
  const [manualHours, setManualHours] = useState("")
  const [manualMinutes, setManualMinutes] = useState("")

  const fetchData = useCallback(async () => {
    try {
      const [projectsRes, entriesRes, activeRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/time-entries"),
        fetch("/api/time-entries/active")
      ])

      if (projectsRes.ok) {
        const data = await projectsRes.json()
        setProjects(data)
      }

      if (entriesRes.ok) {
        const data = await entriesRes.json()
        setEntries(data)
      }

      if (activeRes.ok) {
        const data = await activeRes.json()
        setActiveEntry(data)
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

  const handleStartTimer = async (projectId: string, description: string) => {
    const response = await fetch("/api/time-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, description })
    })

    if (response.ok) {
      const entry = await response.json()
      setActiveEntry(entry)
    }
  }

  const handleStopTimer = async () => {
    const response = await fetch("/api/time-entries/stop", {
      method: "POST"
    })

    if (response.ok) {
      const entry = await response.json()
      setActiveEntry(null)
      setEntries([entry, ...entries])
    }
  }

  const handleEditEntry = async (id: string, data: { description: string; duration: number }) => {
    const response = await fetch(`/api/time-entries/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      fetchData()
    }
  }

  const handleDeleteEntry = async (id: string) => {
    const response = await fetch(`/api/time-entries/${id}`, {
      method: "DELETE"
    })

    if (response.ok) {
      setEntries(entries.filter((e) => e.id !== id))
    }
  }

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newProjectName, color: newProjectColor })
    })

    if (response.ok) {
      const project = await response.json()
      setProjects([project, ...projects])
      setShowNewProject(false)
      setNewProjectName("")
      setNewProjectColor("#3B82F6")
    }
  }

  const handleCreateManualEntry = async () => {
    if (!manualProjectId) return

    const hours = parseInt(manualHours) || 0
    const minutes = parseInt(manualMinutes) || 0
    const duration = hours * 3600 + minutes * 60

    if (duration <= 0) return

    const response = await fetch("/api/time-entries/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: manualProjectId,
        description: manualDescription,
        date: manualDate,
        duration
      })
    })

    if (response.ok) {
      const entry = await response.json()
      setEntries([entry, ...entries])
      setShowManualEntry(false)
      setManualProjectId("")
      setManualDescription("")
      setManualDate(new Date().toISOString().split("T")[0])
      setManualHours("")
      setManualMinutes("")
    }
  }

  // Calculate stats
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todayEntries = entries.filter(
    (e) => new Date(e.startTime) >= today
  )
  const todayTotal = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0)

  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())

  const weekEntries = entries.filter(
    (e) => new Date(e.startTime) >= weekStart
  )
  const weekTotal = weekEntries.reduce((sum, e) => sum + (e.duration || 0), 0)

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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowManualEntry(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Time Entry
          </Button>
          <Button onClick={() => setShowNewProject(true)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>

      {/* Timer */}
      {projects.length > 0 ? (
        <Timer
          projects={projects}
          onStart={handleStartTimer}
          onStop={handleStopTimer}
          activeEntry={activeEntry}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              Create a project to start tracking time
            </p>
            <Button onClick={() => setShowNewProject(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Create your first project
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(todayTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {todayEntries.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(weekTotal)}</div>
            <p className="text-xs text-muted-foreground">
              {weekEntries.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Active projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeEntryList
            entries={entries.slice(0, 10)}
            onEdit={handleEditEntry}
            onDelete={handleDeleteEntry}
          />
        </CardContent>
      </Card>

      {/* New Project Dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name</Label>
              <Input
                id="projectName"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="My Project"
              />
            </div>
            <div>
              <Label htmlFor="projectColor">Color</Label>
              <div className="flex gap-2 mt-2">
                {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"].map(
                  (color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newProjectColor === color
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewProjectColor(color)}
                    />
                  )
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Time Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="manualProject">Project</Label>
              <Select value={manualProjectId} onValueChange={setManualProjectId}>
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
                        <span>{project.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="manualDescription">Description (optional)</Label>
              <Input
                id="manualDescription"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="What did you work on?"
              />
            </div>
            <div>
              <Label htmlFor="manualDate">Date</Label>
              <Input
                id="manualDate"
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
              />
            </div>
            <div>
              <Label>Duration</Label>
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  max="24"
                  value={manualHours}
                  onChange={(e) => setManualHours(e.target.value)}
                  placeholder="0"
                  className="w-20"
                />
                <span className="text-muted-foreground">hours</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={manualMinutes}
                  onChange={(e) => setManualMinutes(e.target.value)}
                  placeholder="0"
                  className="w-20"
                />
                <span className="text-muted-foreground">minutes</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowManualEntry(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateManualEntry}
              disabled={!manualProjectId || ((!manualHours || manualHours === "0") && (!manualMinutes || manualMinutes === "0"))}
            >
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
