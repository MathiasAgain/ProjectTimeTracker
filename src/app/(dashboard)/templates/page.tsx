"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, Play, Sparkles, Clock, Users, Coffee, CheckCircle2, Info } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface Project {
  id: string
  name: string
  color: string
}

interface TimeTemplate {
  id: string
  name: string
  description: string | null
  duration: number
  billable: boolean
  project: Project
  user?: {
    id: string
    name: string | null
    email: string
  }
}

// Default templates that users can choose to add
const DEFAULT_TEMPLATES = [
  {
    id: "meeting",
    name: "Meeting",
    activity: "Meeting",
    description: "Standard team meeting or client call. Use this for scheduled meetings, project discussions, or client presentations.",
    duration: 3600, // 1 hour
    billable: true,
    tags: ["meeting"],
    icon: Users,
  },
  {
    id: "quick-sync",
    name: "Quick Sync",
    activity: "Meeting",
    subtask: "Quick sync",
    description: "Short sync-up call or brief check-in. Perfect for daily standups, quick status updates, or ad-hoc discussions.",
    duration: 900, // 15 minutes
    billable: true,
    tags: ["meeting", "sync"],
    icon: Coffee,
  },
  {
    id: "code-review",
    name: "Code Review",
    activity: "Development",
    subtask: "Code review",
    description: "Reviewing pull requests and providing feedback. Use for reviewing teammates' code or conducting technical reviews.",
    duration: 1800, // 30 minutes
    billable: true,
    tags: ["development", "review"],
    icon: CheckCircle2,
  },
  {
    id: "deep-work",
    name: "Deep Work",
    activity: "Development",
    description: "Focused development or creative work session. Use for coding, design, writing, or any task requiring concentration.",
    duration: 7200, // 2 hours
    billable: true,
    tags: ["development", "focus"],
    icon: Clock,
  },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<TimeTemplate[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [showDefaults, setShowDefaults] = useState(false)
  const [selectedDefaults, setSelectedDefaults] = useState<string[]>([])
  const [defaultProjectId, setDefaultProjectId] = useState("")
  const [addingDefaults, setAddingDefaults] = useState(false)

  // Form state
  const [name, setName] = useState("")
  const [activity, setActivity] = useState("")
  const [subtask, setSubtask] = useState("")
  const [description, setDescription] = useState("")
  const [hours, setHours] = useState("")
  const [minutes, setMinutes] = useState("")
  const [projectId, setProjectId] = useState("")
  const [billable, setBillable] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [templatesRes, projectsRes] = await Promise.all([
        fetch("/api/templates"),
        fetch("/api/projects")
      ])

      if (templatesRes.ok) {
        setTemplates(await templatesRes.json())
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

    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        activity: activity || name,
        subtask,
        description,
        duration,
        billable,
        projectId
      })
    })

    if (response.ok) {
      fetchData()
      resetForm()
      setShowNew(false)
    }
  }

  const handleUse = async (template: TimeTemplate) => {
    const response = await fetch(`/api/templates/${template.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: new Date().toISOString() })
    })

    if (response.ok) {
      alert(`Time entry created for today: ${template.name} (${formatDuration(template.duration)})`)
    }
  }

  const handleDelete = async (id: string) => {
    const response = await fetch(`/api/templates/${id}`, {
      method: "DELETE"
    })

    if (response.ok) {
      setTemplates(templates.filter((t) => t.id !== id))
    }
  }

  const resetForm = () => {
    setName("")
    setActivity("")
    setSubtask("")
    setDescription("")
    setHours("")
    setMinutes("")
    setProjectId("")
    setBillable(true)
  }

  const toggleDefaultSelection = (id: string) => {
    setSelectedDefaults(prev =>
      prev.includes(id)
        ? prev.filter(d => d !== id)
        : [...prev, id]
    )
  }

  const handleAddSelectedDefaults = async () => {
    if (!defaultProjectId || selectedDefaults.length === 0) return

    setAddingDefaults(true)
    let created = 0

    for (const defaultId of selectedDefaults) {
      const template = DEFAULT_TEMPLATES.find(t => t.id === defaultId)
      if (!template) continue

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          activity: template.activity,
          subtask: template.subtask || null,
          description: template.description.split(".")[0], // Just the first sentence
          tags: template.tags,
          duration: template.duration,
          billable: template.billable,
          projectId: defaultProjectId
        })
      })

      if (response.ok) {
        created++
      }
    }

    setAddingDefaults(false)
    setShowDefaults(false)
    setSelectedDefaults([])
    setDefaultProjectId("")
    fetchData()

    if (created > 0) {
      alert(`Successfully added ${created} template${created > 1 ? "s" : ""}!`)
    }
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
          <h1 className="text-2xl font-bold">Time Entry Templates</h1>
          <p className="text-muted-foreground">
            Save common time entries for quick reuse
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDefaults(true)}>
            <Sparkles className="mr-2 h-4 w-4" />
            Add Defaults
          </Button>
          <Button onClick={() => setShowNew(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* How to use info box */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">How to use templates</p>
              <p className="text-blue-700 dark:text-blue-300">
                Click the <strong>Use</strong> button on any template to instantly create a time entry for today with the template&apos;s settings.
                Templates save you time by pre-filling activity, duration, and project information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No templates yet. Create your own or choose from our suggested templates.
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => setShowDefaults(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Browse Defaults
              </Button>
              <Button onClick={() => setShowNew(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: template.project.color }}
                    />
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {template.project.name}
                </p>
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {template.description}
                  </p>
                )}
                {template.user && (
                  <p className="text-xs text-muted-foreground mb-2">
                    Created by: {template.user.name || template.user.email}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium">{formatDuration(template.duration)}</span>
                    {!template.billable && (
                      <span className="ml-2 text-muted-foreground">(Non-billable)</span>
                    )}
                  </div>
                  <Button size="sm" onClick={() => handleUse(template)}>
                    <Play className="mr-1 h-3 w-3" />
                    Use
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Defaults Dialog */}
      <Dialog open={showDefaults} onOpenChange={setShowDefaults}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Default Templates</DialogTitle>
            <DialogDescription>
              Select the templates you want to add and choose a project for them.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Project selection */}
            <div>
              <Label>Project for templates</Label>
              <Select value={defaultProjectId} onValueChange={setDefaultProjectId}>
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

            {/* Template selection */}
            <div>
              <Label className="mb-2 block">Select templates to add</Label>
              <div className="space-y-3">
                {DEFAULT_TEMPLATES.map((template) => {
                  const Icon = template.icon
                  const isSelected = selectedDefaults.includes(template.id)

                  return (
                    <div
                      key={template.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => toggleDefaultSelection(template.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                          <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{template.name}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                {formatDuration(template.duration)}
                              </span>
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                              }`}>
                                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary-foreground" />}
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            {template.tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-muted rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {template.billable && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded">
                                billable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDefaults(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddSelectedDefaults}
              disabled={!defaultProjectId || selectedDefaults.length === 0 || addingDefaults}
            >
              {addingDefaults ? "Adding..." : `Add ${selectedDefaults.length} Template${selectedDefaults.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Template Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Template</DialogTitle>
            <DialogDescription>
              Create a reusable template for common time entries.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Code review"
              />
            </div>
            <div>
              <Label htmlFor="activity">Activity</Label>
              <Input
                id="activity"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="e.g., Development, Meeting"
              />
            </div>
            <div>
              <Label htmlFor="subtask">Subtask (optional)</Label>
              <Input
                id="subtask"
                value={subtask}
                onChange={(e) => setSubtask(e.target.value)}
                placeholder="e.g., Bug fixes, Documentation"
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
