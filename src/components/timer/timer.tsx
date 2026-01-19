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
import { Play, Square } from "lucide-react"
import { formatDuration } from "@/lib/utils"

interface Project {
  id: string
  name: string
  color: string
}

interface TimerProps {
  projects: Project[]
  onStart: (projectId: string, description: string) => Promise<void>
  onStop: () => Promise<void>
  activeEntry?: {
    id: string
    projectId: string
    description: string | null
    startTime: Date
  } | null
}

export function Timer({ projects, onStart, onStop, activeEntry }: TimerProps) {
  const [description, setDescription] = useState(activeEntry?.description || "")
  const [projectId, setProjectId] = useState(activeEntry?.projectId || "")
  const [elapsed, setElapsed] = useState(0)
  const [loading, setLoading] = useState(false)

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

  const selectedProject = projects.find((p) => p.id === (activeEntry?.projectId || projectId))

  return (
    <div className="bg-card rounded-xl border p-4 md:p-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        {/* Description input */}
        <Input
          placeholder="What are you working on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={!!activeEntry}
          className="flex-1"
        />

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
