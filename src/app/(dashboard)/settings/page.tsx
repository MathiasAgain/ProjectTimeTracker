"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTheme } from "@/components/theme-provider"
import { Moon, Sun, Monitor, User, Shield, Bell, Clock, FolderKanban } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Project {
  id: string
  name: string
  color: string
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  // Preferences state
  const [projects, setProjects] = useState<Project[]>([])
  const [defaultProjectId, setDefaultProjectId] = useState<string>("")
  const [workingHoursStart, setWorkingHoursStart] = useState("09:00")
  const [workingHoursEnd, setWorkingHoursEnd] = useState("17:00")
  const [weeklyHoursGoal, setWeeklyHoursGoal] = useState("40")
  const [defaultBillable, setDefaultBillable] = useState(true)
  const [reminderEnabled, setReminderEnabled] = useState(false)
  const [preferencesLoading, setPreferencesLoading] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects")
      if (res.ok) {
        const data = await res.json()
        setProjects(data)
      }
    } catch (error) {
      console.error("Error fetching projects:", error)
    }
  }, [])

  useEffect(() => {
    fetchProjects()
    // Load preferences from localStorage
    const savedPrefs = localStorage.getItem("timetracker-preferences")
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs)
        setDefaultProjectId(prefs.defaultProjectId || "")
        setWorkingHoursStart(prefs.workingHoursStart || "09:00")
        setWorkingHoursEnd(prefs.workingHoursEnd || "17:00")
        setWeeklyHoursGoal(prefs.weeklyHoursGoal || "40")
        setDefaultBillable(prefs.defaultBillable !== false)
        setReminderEnabled(prefs.reminderEnabled || false)
      } catch {
        // Invalid JSON, ignore
      }
    }
  }, [fetchProjects])

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "")
      setEmail(session.user.email || "")
    }
  }, [session])

  const handleSavePreferences = () => {
    setPreferencesLoading(true)
    const prefs = {
      defaultProjectId,
      workingHoursStart,
      workingHoursEnd,
      weeklyHoursGoal,
      defaultBillable,
      reminderEnabled
    }
    localStorage.setItem("timetracker-preferences", JSON.stringify(prefs))
    setPreferencesLoading(false)
    toast({
      title: "Preferences saved",
      description: "Your preferences have been updated",
      variant: "success",
    })
  }

  const handleUpdateProfile = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      })

      if (response.ok) {
        setMessage("Profile updated successfully")
        update({ name })
      } else {
        const data = await response.json()
        setError(data.error || "Failed to update profile")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    setLoading(true)
    setMessage("")
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      })

      if (response.ok) {
        setMessage("Password changed successfully")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to change password")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences">
            <Bell className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
                  {message}
                </div>
              )}
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Email cannot be changed
                </p>
              </div>
              <Button onClick={handleUpdateProfile} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md">
                  {message}
                </div>
              )}
              {error && (
                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                {loading ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="mt-6 space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>
                Customize how the app looks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label>Theme</Label>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    onClick={() => setTheme("light")}
                    className="flex-1"
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    onClick={() => setTheme("dark")}
                    className="flex-1"
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    onClick={() => setTheme("system")}
                    className="flex-1"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking Defaults */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5" />
                Time Tracking Defaults
              </CardTitle>
              <CardDescription>
                Set your default project and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="defaultProject">Default Project</Label>
                <Select value={defaultProjectId} onValueChange={setDefaultProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="No default project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No default project</SelectItem>
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
                <p className="text-sm text-muted-foreground mt-1">
                  Pre-selected project when starting a new timer
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Default Billable</Label>
                  <p className="text-sm text-muted-foreground">
                    New time entries are billable by default
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={defaultBillable}
                  onChange={(e) => setDefaultBillable(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
            </CardContent>
          </Card>

          {/* Working Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Working Hours
              </CardTitle>
              <CardDescription>
                Define your typical working schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workStart">Start Time</Label>
                  <Input
                    id="workStart"
                    type="time"
                    value={workingHoursStart}
                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="workEnd">End Time</Label>
                  <Input
                    id="workEnd"
                    type="time"
                    value={workingHoursEnd}
                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="weeklyGoal">Weekly Hours Goal</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weeklyGoal"
                    type="number"
                    min="0"
                    max="168"
                    value={weeklyHoursGoal}
                    onChange={(e) => setWeeklyHoursGoal(e.target.value)}
                    className="w-24"
                  />
                  <span className="text-muted-foreground">hours per week</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Used for progress tracking on the dashboard
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Reminders
              </CardTitle>
              <CardDescription>
                Configure notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Reminder</Label>
                  <p className="text-sm text-muted-foreground">
                    Remind me to track time if no entries today
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={reminderEnabled}
                  onChange={(e) => setReminderEnabled(e.target.checked)}
                  className="h-4 w-4"
                />
              </div>
              <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                Note: Browser notifications require permission to be granted when prompted.
              </p>
            </CardContent>
          </Card>

          <Button onClick={handleSavePreferences} disabled={preferencesLoading}>
            {preferencesLoading ? "Saving..." : "Save Preferences"}
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  )
}
