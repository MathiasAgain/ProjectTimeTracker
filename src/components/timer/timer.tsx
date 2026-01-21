"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Play, Square, Edit2, Check, X } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Project {
  id: string
  name: string
  color: string
}

interface TimerProps {
  projects: Project[]
  onStart: (projectId: string, description: string) => Promise<void>
  onStop: () => Promise<void>
  onUpdateDescription?: (id: string, description: string) => Promise<void>
  activeEntry?: {
    id: string
    projectId: string
    description: string | null
    startTime: Date
  } | null
}

export function Timer({ projects, onStart, onStop, onUpdateDescription, activeEntry }: TimerProps) {
  const { toast } = useToast()
  const [description, setDescription] = useState(activeEntry?.description || "")
  const [projectId, setProjectId] = useState(activeEntry?.projectId || "")
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editDescription, setEditDescription] = useState("")

  // Calculate elapsed time
  useEffect(() => {
    if (activeEntry) {
      const startTime = new Date(activeEntry.startTime).getTime()
      const updateElapsed = () => {
        setElapsed(Math.floor((Date.now() - startTime) / 1000))
      }
      updateElapsed()
      const interval = setInterval(updateElapsed, 1000)
      return () => clearInterval(interval)
    } else {
      setElapsed(0)
    }
  }, [activeEntry])

  // Update browser tab title with timer
  useEffect(() => {
    if (activeEntry) {
      document.title = `${formatDuration(elapsed)} - TimeTracker`
    } else {
      document.title = "TimeTracker"
    }
    return () => {
      document.title = "TimeTracker"
    }
  }, [activeEntry, elapsed])

  const handleStart = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    try {
      await onStart(projectId, description)
    } finally {
      setLoading(false)
    }
  }, [projectId, description, onStart])

  const handleStop = useCallback(async () => {
    setLoading(true)
    try {
      await onStop()
      setDescription("")
    } finally {
      setLoading(false)
    }
  }, [onStop])

  const handleStartEditDescription = useCallback(() => {
    setEditDescription(activeEntry?.description || "")
    setIsEditingDescription(true)
  }, [activeEntry?.description])

  const handleCancelEditDescription = useCallback(() => {
    setIsEditingDescription(false)
    setEditDescription("")
  }, [])

  const handleSaveDescription = useCallback(async () => {
    if (!activeEntry || !onUpdateDescription) return
    setLoading(true)
    try {
      await onUpdateDescription(activeEntry.id, editDescription)
      setIsEditingDescription(false)
      toast({
        title: "Description updated",
        description: "Timer description has been saved",
        variant: "success",
      })
    } catch {
      toast({
        title: "Error",
        description: "Failed to update description",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [activeEntry, editDescription, onUpdateDescription, toast])

  const selectedProject = projects.find((p) => p.id === (activeEntry?.projectId || projectId))

  return (
    <div className="bg-card rounded-xl border p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Description input */}
        {activeEntry ? (
          isEditingDescription ? (
            <div className="flex-1 flex items-center gap-2 w-full">
              <Input
                placeholder="What are you working on?"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="flex-1"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveDescription()
                  if (e.key === "Escape") handleCancelEditDescription()
                }}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSaveDescription}
                disabled={loading}
                className="shrink-0"
                title="Save"
              >
                <Check className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCancelEditDescription}
                disabled={loading}
                className="shrink-0"
                title="Cancel"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex items-center gap-2 w-full">
              <div className="flex-1 px-3 py-2 border rounded-md bg-muted/50 text-sm min-h-[40px] flex items-center">
                {activeEntry.description || <span className="text-muted-foreground italic">No description</span>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleStartEditDescription}
                className="shrink-0"
                title="Edit description"
              >
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          )
        ) : (
          <Input
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="flex-1"
          />
        )}

        {/* Project selector */}
        <Select
          value={activeEntry?.projectId || projectId}
          onValueChange={setProjectId}
          disabled={!!activeEntry}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select project">
              {selectedProject && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedProject.color }}
                  />
                  <span>{selectedProject.name}</span>
                </div>
              )}
            </SelectValue>
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

        {/* Timer display */}
        <div className="font-mono text-2xl md:text-3xl font-bold min-w-[120px] text-center">
          {formatDuration(elapsed)}
        </div>

        {/* Start/Stop button */}
        {activeEntry ? (
          <Button
            onClick={handleStop}
            disabled={loading}
            size="lg"
            variant="destructive"
            className="w-full md:w-auto"
          >
            <Square className="mr-2 h-4 w-4" />
            Stop
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            disabled={loading || !projectId}
            size="lg"
            className="w-full md:w-auto"
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        )}
      </div>
    </div>
  )
}
