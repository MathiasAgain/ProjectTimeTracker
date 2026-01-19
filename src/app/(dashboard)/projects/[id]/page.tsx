"use client"

import { useEffect, useState, useCallback, use } from "react"
import { useRouter } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TimeEntryList } from "@/components/time-entry/time-entry-list"
import {
  ArrowLeft,
  Plus,
  Settings,
  Users,
  Clock,
  CheckSquare,
  Trash2,
  UserPlus,
  DollarSign,
  Target,
  Copy,
  Check,
} from "lucide-react"
import { formatDuration } from "@/lib/utils"
import Link from "next/link"

interface Task {
  id: string
  name: string
  description: string | null
  completed: boolean
}

interface Member {
  id: string
  role: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface Project {
  id: string
  name: string
  description: string | null
  color: string
  archived: boolean
  budgetHours: number | null
  hourlyRate: number | null
  ownerId: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  members: Member[]
  tasks: Task[]
  _count: {
    timeEntries: number
  }
}

interface TimeEntry {
  id: string
  activity: string | null
  subtask: string | null
  notes: string | null
  tags: string[]
  description: string | null
  startTime: Date
  endTime: Date | null
  duration: number | null
  project: {
    id: string
    name: string
    color: string
  }
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editColor, setEditColor] = useState("")
  const [editBudgetHours, setEditBudgetHours] = useState("")
  const [editHourlyRate, setEditHourlyRate] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLink, setInviteLink] = useState("")
  const [inviteCopied, setInviteCopied] = useState(false)
  const [inviteMessage, setInviteMessage] = useState("")
  const [newTaskName, setNewTaskName] = useState("")

  // Manual time entry state
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualActivity, setManualActivity] = useState("")
  const [manualSubtask, setManualSubtask] = useState("")
  const [manualNotes, setManualNotes] = useState("")
  const [manualDate, setManualDate] = useState(() => new Date().toISOString().split("T")[0])
  const [manualHours, setManualHours] = useState("")
  const [manualMinutes, setManualMinutes] = useState("")
  const [manualTaskId, setManualTaskId] = useState("")

  const fetchProject = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
        setEditName(data.name)
        setEditDescription(data.description || "")
        setEditColor(data.color)
        setEditBudgetHours(data.budgetHours?.toString() || "")
        setEditHourlyRate(data.hourlyRate?.toString() || "")
      } else {
        router.push("/projects")
      }
    } catch (error) {
      console.error("Error fetching project:", error)
    }
  }, [id, router])

  const fetchEntries = useCallback(async () => {
    try {
      const response = await fetch(`/api/time-entries?projectId=${id}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error("Error fetching entries:", error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProject()
    fetchEntries()
  }, [fetchProject, fetchEntries])

  const handleUpdateProject = async () => {
    const response = await fetch(`/api/projects/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editName,
        description: editDescription,
        color: editColor,
        budgetHours: editBudgetHours ? parseInt(editBudgetHours) : null,
        hourlyRate: editHourlyRate ? parseFloat(editHourlyRate) : null
      })
    })

    if (response.ok) {
      fetchProject()
      setShowSettings(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) return

    const response = await fetch(`/api/projects/${id}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail })
    })

    if (response.ok) {
      const data = await response.json()

      if (data.inviteLink) {
        // Non-existing user - show the invite link
        const fullLink = `${window.location.origin}${data.inviteLink}`
        setInviteLink(fullLink)
        if (data.emailSent) {
          setInviteMessage(`Invitation email sent to ${inviteEmail}! You can also share the link below. Expires in 7 days.`)
        } else {
          setInviteMessage(`Share this link with ${inviteEmail}. The invitation expires in 7 days.`)
        }
      } else {
        // Existing user - already added as member
        setInviteMessage(data.message)
        setInviteLink("")
      }

      setInviteEmail("")
      setInviteCopied(false)
      fetchProject()
    }
  }

  const handleCopyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setInviteCopied(true)
      setTimeout(() => setInviteCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleCloseInvite = () => {
    setShowInvite(false)
    setInviteEmail("")
    setInviteLink("")
    setInviteMessage("")
    setInviteCopied(false)
  }

  const handleRemoveMember = async (memberId: string) => {
    const response = await fetch(`/api/projects/${id}/members/${memberId}`, {
      method: "DELETE"
    })

    if (response.ok) {
      fetchProject()
    }
  }

  const handleCreateTask = async () => {
    if (!newTaskName.trim()) return

    const response = await fetch(`/api/projects/${id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newTaskName })
    })

    if (response.ok) {
      fetchProject()
      setShowNewTask(false)
      setNewTaskName("")
    }
  }

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    const response = await fetch(`/api/projects/${id}/tasks/${taskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed })
    })

    if (response.ok) {
      fetchProject()
    }
  }

  const handleDeleteTask = async (taskId: string) => {
    const response = await fetch(`/api/projects/${id}/tasks/${taskId}`, {
      method: "DELETE"
    })

    if (response.ok) {
      fetchProject()
    }
  }

  const handleEditEntry = async (
    entryId: string,
    data: { activity?: string; subtask?: string; notes?: string; tags?: string[]; description?: string; duration: number }
  ) => {
    const response = await fetch(`/api/time-entries/${entryId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })

    if (response.ok) {
      fetchEntries()
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    const response = await fetch(`/api/time-entries/${entryId}`, {
      method: "DELETE"
    })

    if (response.ok) {
      setEntries(entries.filter((e) => e.id !== entryId))
    }
  }

  const handleCreateManualEntry = async () => {
    const hours = parseInt(manualHours) || 0
    const minutes = parseInt(manualMinutes) || 0
    const duration = hours * 3600 + minutes * 60

    if (duration <= 0) return

    const response = await fetch("/api/time-entries/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: id,
        taskId: manualTaskId || null,
        activity: manualActivity,
        subtask: manualSubtask,
        notes: manualNotes,
        date: manualDate,
        duration
      })
    })

    if (response.ok) {
      const entry = await response.json()
      setEntries([entry, ...entries])
      setShowManualEntry(false)
      setManualActivity("")
      setManualSubtask("")
      setManualNotes("")
      setManualDate(new Date().toISOString().split("T")[0])
      setManualHours("")
      setManualMinutes("")
      setManualTaskId("")
    }
  }

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const totalTime = entries.reduce((sum, e) => sum + (e.duration || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: project.color }}
          />
          <h1 className="text-2xl font-bold">{project.name}</h1>
        </div>
        <Button variant="outline" onClick={() => setShowSettings(true)}>
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      {project.description && (
        <p className="text-muted-foreground">{project.description}</p>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDuration(totalTime)}</div>
          </CardContent>
        </Card>
        {project.budgetHours && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(totalTime / 3600)}/{project.budgetHours}h
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    (totalTime / 3600 / project.budgetHours) > 0.9
                      ? "bg-destructive"
                      : (totalTime / 3600 / project.budgetHours) > 0.7
                      ? "bg-yellow-500"
                      : "bg-primary"
                  }`}
                  style={{
                    width: `${Math.min(100, (totalTime / 3600 / project.budgetHours) * 100)}%`
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
        {project.hourlyRate && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Billable Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${((totalTime / 3600) * project.hourlyRate).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                @ ${project.hourlyRate}/hr
              </p>
            </CardContent>
          </Card>
        )}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.members.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.tasks.filter((t) => t.completed).length}/{project.tasks.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="entries">
        <TabsList>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>

        <TabsContent value="entries" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Time Entries</CardTitle>
              <Button onClick={() => setShowManualEntry(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Time Entry
              </Button>
            </CardHeader>
            <CardContent>
              <TimeEntryList
                entries={entries}
                onEdit={handleEditEntry}
                onDelete={handleDeleteEntry}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Tasks</CardTitle>
              <Button onClick={() => setShowNewTask(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </CardHeader>
            <CardContent>
              {project.tasks.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No tasks yet
                </p>
              ) : (
                <div className="space-y-2">
                  {project.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) =>
                          handleToggleTask(task.id, e.target.checked)
                        }
                        className="h-4 w-4"
                      />
                      <span
                        className={`flex-1 ${
                          task.completed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {task.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Button onClick={() => setShowInvite(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {project.members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {member.user.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">
                          {member.user.name || member.user.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        {member.role}
                      </span>
                      {member.role !== "OWNER" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Project Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editName">Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <div>
              <Label>Color</Label>
              <div className="flex gap-2 mt-2">
                {["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16"].map(
                  (color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full border-2 ${
                        editColor === color
                          ? "border-foreground"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setEditColor(color)}
                    />
                  )
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editBudgetHours">Budget (hours)</Label>
                <Input
                  id="editBudgetHours"
                  type="number"
                  min="0"
                  value={editBudgetHours}
                  onChange={(e) => setEditBudgetHours(e.target.value)}
                  placeholder="e.g., 100"
                />
              </div>
              <div>
                <Label htmlFor="editHourlyRate">Hourly Rate ($)</Label>
                <Input
                  id="editHourlyRate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={editHourlyRate}
                  onChange={(e) => setEditHourlyRate(e.target.value)}
                  placeholder="e.g., 75"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={handleCloseInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>

          {inviteMessage ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">{inviteMessage}</p>
                {inviteLink && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      value={inviteLink}
                      readOnly
                      className="flex-1 font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleCopyInviteLink}
                      title="Copy link"
                    >
                      {inviteCopied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseInvite}>
                  Done
                </Button>
                <Button onClick={() => {
                  setInviteMessage("")
                  setInviteLink("")
                }}>
                  Invite Another
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div>
                <Label htmlFor="inviteEmail">Email Address</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleInviteMember()
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  If the user has an account, they&apos;ll be added immediately.
                  Otherwise, you&apos;ll get a shareable invite link.
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseInvite}>
                  Cancel
                </Button>
                <Button onClick={handleInviteMember} disabled={!inviteEmail.trim()}>
                  Send Invitation
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Task Dialog */}
      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <div>
            <Label htmlFor="taskName">Task Name</Label>
            <Input
              id="taskName"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="What needs to be done?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTask}>Add Task</Button>
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
              <Label htmlFor="manualActivity">Activity</Label>
              <Input
                id="manualActivity"
                value={manualActivity}
                onChange={(e) => setManualActivity(e.target.value)}
                placeholder="e.g., Power BI, Development, Design"
              />
            </div>
            <div>
              <Label htmlFor="manualSubtask">Subtask</Label>
              <Input
                id="manualSubtask"
                value={manualSubtask}
                onChange={(e) => setManualSubtask(e.target.value)}
                placeholder="e.g., Modeling of bridge table"
              />
            </div>
            <div>
              <Label htmlFor="manualNotes">Notes</Label>
              <textarea
                id="manualNotes"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
                placeholder="e.g., Developed logic for table X to..."
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {project.tasks.length > 0 && (
              <div>
                <Label htmlFor="manualTask">Project Task (optional)</Label>
                <Select value={manualTaskId} onValueChange={setManualTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a task" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No task</SelectItem>
                    {project.tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
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
              disabled={((!manualHours || manualHours === "0") && (!manualMinutes || manualMinutes === "0"))}
            >
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
