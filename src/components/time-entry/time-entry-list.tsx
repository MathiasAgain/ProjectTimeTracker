"use client"

import { useState } from "react"
import { formatDuration, formatTime, formatDate } from "@/lib/utils"
import { getTagClasses } from "@/lib/tag-colors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Pencil, Trash2, X, Copy, Star, MessageSquare, Send } from "lucide-react"

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

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
}

interface TimeEntryListProps {
  entries: TimeEntry[]
  onEdit: (id: string, data: { activity?: string; subtask?: string; notes?: string; tags?: string[]; description?: string; duration: number }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onDuplicate?: (id: string) => Promise<void>
  onToggleFavorite?: (projectId: string) => Promise<void>
  favoriteProjectIds?: Set<string>
  canEdit?: boolean
}

export function TimeEntryList({
  entries,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  favoriteProjectIds = new Set(),
  canEdit = true
}: TimeEntryListProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [editActivity, setEditActivity] = useState("")
  const [editSubtask, setEditSubtask] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editTags, setEditTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [editHours, setEditHours] = useState("0")
  const [editMinutes, setEditMinutes] = useState("0")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Comments state
  const [commentsEntry, setCommentsEntry] = useState<TimeEntry | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)

  const groupedEntries = entries.reduce((groups, entry) => {
    const date = formatDate(new Date(entry.startTime))
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(entry)
    return groups
  }, {} as Record<string, TimeEntry[]>)

  const handleEditOpen = (entry: TimeEntry) => {
    setEditingEntry(entry)
    setEditActivity(entry.activity || "")
    setEditSubtask(entry.subtask || "")
    setEditNotes(entry.notes || "")
    setEditTags(entry.tags || [])
    setNewTag("")
    const duration = entry.duration || 0
    setEditHours(Math.floor(duration / 3600).toString())
    setEditMinutes(Math.floor((duration % 3600) / 60).toString())
  }

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase()
    if (tag && !editTags.includes(tag)) {
      setEditTags([...editTags, tag])
      setNewTag("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter(t => t !== tagToRemove))
  }

  const handleEditSave = async () => {
    if (!editingEntry) return
    setLoading(true)
    try {
      const duration = parseInt(editHours) * 3600 + parseInt(editMinutes) * 60
      await onEdit(editingEntry.id, {
        activity: editActivity,
        subtask: editSubtask,
        notes: editNotes,
        tags: editTags,
        duration
      })
      setEditingEntry(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      await onDelete(id)
      setDeleteConfirm(null)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenComments = async (entry: TimeEntry) => {
    setCommentsEntry(entry)
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/time-entries/${entry.id}/comments`)
      if (res.ok) {
        const data = await res.json()
        setComments(data)
      }
    } catch (error) {
      console.error("Error loading comments:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  const handleAddComment = async () => {
    if (!commentsEntry || !newComment.trim()) return
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/time-entries/${commentsEntry.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment })
      })
      if (res.ok) {
        const comment = await res.json()
        setComments([...comments, comment])
        setNewComment("")
      }
    } catch (error) {
      console.error("Error adding comment:", error)
    } finally {
      setLoadingComments(false)
    }
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No time entries yet. Start tracking!
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {Object.entries(groupedEntries).map(([date, dayEntries]) => {
          const totalDuration = dayEntries.reduce(
            (sum, entry) => sum + (entry.duration || 0),
            0
          )
          return (
            <div key={date}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-medium">{date}</h3>
                <span className="text-sm text-muted-foreground">
                  Total: {formatDuration(totalDuration)}
                </span>
              </div>
              <div className="space-y-2">
                {dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center gap-4 p-4 bg-card rounded-lg border"
                  >
                    <div className="flex items-center gap-2">
                      {onToggleFavorite && (
                        <button
                          onClick={() => onToggleFavorite(entry.project.id)}
                          className="text-muted-foreground hover:text-yellow-500 transition-colors"
                          title={favoriteProjectIds.has(entry.project.id) ? "Remove from favorites" : "Add to favorites"}
                        >
                          <Star
                            className={`h-4 w-4 ${favoriteProjectIds.has(entry.project.id) ? "text-yellow-500 fill-yellow-500" : ""}`}
                          />
                        </button>
                      )}
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: entry.project.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {entry.activity || entry.description || "No description"}
                          {entry.subtask && (
                            <span className="text-muted-foreground font-normal"> → {entry.subtask}</span>
                          )}
                        </p>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-1 flex-shrink-0">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className={`px-1.5 py-0.5 text-xs rounded ${getTagClasses(tag)}`}
                              >
                                {tag}
                              </span>
                            ))}
                            {entry.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{entry.tags.length - 3}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{entry.project.name}</span>
                        {entry.notes && (
                          <>
                            <span>•</span>
                            <span className="truncate">{entry.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground hidden sm:block">
                      {formatTime(new Date(entry.startTime))} -{" "}
                      {entry.endTime
                        ? formatTime(new Date(entry.endTime))
                        : "Running"}
                    </div>
                    <div className="font-mono font-medium">
                      {formatDuration(entry.duration || 0)}
                    </div>
                    {canEdit && (
                      <div className="flex gap-1">
                        {onDuplicate && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDuplicate(entry.id)}
                            title="Duplicate entry"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenComments(entry)}
                          title="Comments"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOpen(entry)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteConfirm(entry.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onOpenChange={() => setEditingEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Time Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Activity</label>
              <Input
                value={editActivity}
                onChange={(e) => setEditActivity(e.target.value)}
                placeholder="e.g., Power BI, Development, Design"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subtask</label>
              <Input
                value={editSubtask}
                onChange={(e) => setEditSubtask(e.target.value)}
                placeholder="e.g., Modeling of bridge table"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="e.g., Developed logic for table X to..."
                className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {editTags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {editTags.map((tag) => (
                    <span
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${getTagClasses(tag)}`}
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:opacity-70 rounded"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Hours</label>
                <Input
                  type="number"
                  min="0"
                  value={editHours}
                  onChange={(e) => setEditHours(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Minutes</label>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={editMinutes}
                  onChange={(e) => setEditMinutes(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingEntry(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={!!commentsEntry} onOpenChange={() => setCommentsEntry(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comments</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {commentsEntry && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{commentsEntry.activity || commentsEntry.description || "Time entry"}</p>
                <p className="text-muted-foreground">{commentsEntry.project.name}</p>
              </div>
            )}

            <div className="max-h-64 overflow-y-auto space-y-3">
              {loadingComments ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="p-3 bg-card border rounded-lg">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">{comment.user.name || comment.user.email}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{comment.content}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleAddComment()
                  }
                }}
              />
              <Button onClick={handleAddComment} disabled={loadingComments || !newComment.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Time Entry</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this time entry? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
