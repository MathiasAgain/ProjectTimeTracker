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
import {
  Building2,
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Trash2,
  Mail,
  Copy,
  Check,
  LogOut,
  X
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Organization {
  id: string
  name: string
  owner: {
    id: string
    name: string | null
    email: string
  }
  _count: {
    projects: number
    members: number
  }
}

interface Member {
  id: string
  name: string | null
  email: string
  orgRole: "OWNER" | "ADMIN" | "MEMBER"
  createdAt: string
  _count: {
    timeEntries: number
  }
}

interface Invitation {
  id: string
  email: string
  role: "ADMIN" | "MEMBER"
  status: string
  expiresAt: string
  inviteUrl?: string
}

export default function OrganizationPage() {
  const { toast } = useToast()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [userRole, setUserRole] = useState<"OWNER" | "ADMIN" | "MEMBER">("MEMBER")
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)

  // Create org state
  const [showCreateOrg, setShowCreateOrg] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [creating, setCreating] = useState(false)

  // Invite state
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER")
  const [inviting, setInviting] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)
  const [copiedUrl, setCopiedUrl] = useState(false)

  // Leave/Delete state
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [orgRes, membersRes, invitesRes] = await Promise.all([
        fetch("/api/organization"),
        fetch("/api/organization/members"),
        fetch("/api/organization/invite")
      ])

      if (orgRes.ok) {
        const data = await orgRes.json()
        setOrganization(data.organization)
        setUserRole(data.userRole)
      }

      if (membersRes.ok) {
        const data = await membersRes.json()
        setMembers(data)
      }

      if (invitesRes.ok) {
        const data = await invitesRes.json()
        setInvitations(data)
      }
    } catch (error) {
      console.error("Error fetching organization data:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreateOrg = async () => {
    if (!newOrgName.trim()) return
    setCreating(true)

    try {
      const res = await fetch("/api/organization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newOrgName })
      })

      if (res.ok) {
        setShowCreateOrg(false)
        setNewOrgName("")
        fetchData()
        toast({
          title: "Organization created",
          description: "Your organization has been set up successfully",
          variant: "success",
        })
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to create organization",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)

    try {
      const res = await fetch("/api/organization/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      })

      if (res.ok) {
        const data = await res.json()
        setLastInviteUrl(data.inviteUrl)
        setInviteEmail("")
        fetchData()
        toast({
          title: "Invitation sent",
          description: "The invitation has been sent successfully",
          variant: "success",
        })
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to send invitation",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  const handleCopyInviteUrl = () => {
    if (lastInviteUrl) {
      navigator.clipboard.writeText(lastInviteUrl)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  const handleChangeMemberRole = async (memberId: string, newRole: "ADMIN" | "MEMBER") => {
    try {
      const res = await fetch(`/api/organization/members/${memberId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
      })

      if (res.ok) {
        fetchData()
        toast({
          title: "Role updated",
          description: `Member role changed to ${newRole.toLowerCase()}`,
        })
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to update role",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update role",
        variant: "destructive",
      })
    }
  }

  const [showRemoveMemberConfirm, setShowRemoveMemberConfirm] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null)

  const handleRemoveMember = async (memberId: string) => {
    try {
      const res = await fetch(`/api/organization/members/${memberId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        fetchData()
        setShowRemoveMemberConfirm(false)
        setMemberToRemove(null)
        toast({
          title: "Member removed",
          description: "The member has been removed from the organization",
        })
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to remove member",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove member",
        variant: "destructive",
      })
    }
  }

  const [showCancelInviteConfirm, setShowCancelInviteConfirm] = useState(false)
  const [inviteToCancel, setInviteToCancel] = useState<string | null>(null)

  const handleCancelInvitation = async (inviteId: string) => {
    try {
      const res = await fetch(`/api/organization/invite/${inviteId}`, {
        method: "DELETE"
      })

      if (res.ok) {
        fetchData()
        setShowCancelInviteConfirm(false)
        setInviteToCancel(null)
        toast({
          title: "Invitation cancelled",
          description: "The invitation has been cancelled",
        })
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to cancel invitation",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      })
    }
  }

  const handleLeaveOrg = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/organization/members/${members.find(m => m.orgRole === userRole)?.id}`, {
        method: "DELETE"
      })

      if (res.ok) {
        toast({
          title: "Left organization",
          description: "You have left the organization",
        })
        window.location.reload()
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to leave organization",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to leave organization",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setShowLeaveConfirm(false)
    }
  }

  const handleDeleteOrg = async () => {
    setActionLoading(true)
    try {
      const res = await fetch("/api/organization", {
        method: "DELETE"
      })

      if (res.ok) {
        toast({
          title: "Organization deleted",
          description: "The organization has been deleted",
        })
        window.location.reload()
      } else {
        const data = await res.json()
        toast({
          title: "Error",
          description: data.error || "Failed to delete organization",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete organization",
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "OWNER":
        return <Crown className="h-4 w-4 text-yellow-500" />
      case "ADMIN":
        return <Shield className="h-4 w-4 text-blue-500" />
      default:
        return <User className="h-4 w-4 text-muted-foreground" />
    }
  }

  const isAdmin = userRole === "OWNER" || userRole === "ADMIN"
  const isOwner = userRole === "OWNER"

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // No organization - show create option
  if (!organization) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Organization</h1>

        <Card className="max-w-xl">
          <CardHeader>
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-center">No Organization</CardTitle>
            <CardDescription className="text-center">
              Create an organization to share projects and collaborate with your team.
              All members will have access to all projects and time entries.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setShowCreateOrg(true)}>
              <Building2 className="mr-2 h-4 w-4" />
              Create Organization
            </Button>
          </CardContent>
        </Card>

        {/* Create Organization Dialog */}
        <Dialog open={showCreateOrg} onOpenChange={setShowCreateOrg}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Create a new organization. All your existing projects will be moved to the organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="My Company"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateOrg(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrg} disabled={creating || !newOrgName.trim()}>
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">Organization</h1>
        {isAdmin && (
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Invite Member
          </Button>
        )}
      </div>

      {/* Organization Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>{organization.name}</CardTitle>
              <CardDescription>
                {organization._count.members} members · {organization._count.projects} projects
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span>Owner: {organization.owner.name || organization.owner.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getRoleIcon(member.orgRole)}
                  <div>
                    <p className="font-medium">{member.name || member.email}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {member._count.timeEntries} entries
                  </span>
                  {isAdmin && member.orgRole !== "OWNER" && (
                    <>
                      {isOwner && (
                        <Select
                          value={member.orgRole}
                          onValueChange={(value) => handleChangeMemberRole(member.id, value as "ADMIN" | "MEMBER")}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMemberToRemove(member.id)
                          setShowRemoveMemberConfirm(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {isAdmin && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {invitations.map((invite) => (
                <div
                  key={invite.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Invited as {invite.role} · Expires {new Date(invite.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setInviteToCancel(invite.id)
                      setShowCancelInviteConfirm(true)
                    }}
                    title="Cancel invitation"
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isOwner && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Leave Organization</p>
                <p className="text-sm text-muted-foreground">
                  Leave this organization. Your time entries will remain.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowLeaveConfirm(true)}>
                <LogOut className="mr-2 h-4 w-4" />
                Leave
              </Button>
            </div>
          )}
          {isOwner && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Organization</p>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this organization. Members will be removed but data remains.
                </p>
              </div>
              <Button variant="destructive" onClick={() => setShowDeleteConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={(open) => {
        setShowInvite(open)
        if (!open) {
          setLastInviteUrl(null)
          setInviteEmail("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your organization.
            </DialogDescription>
          </DialogHeader>
          {lastInviteUrl ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="font-medium text-green-800 dark:text-green-200">Invitation Sent!</p>
              </div>
              <div>
                <Label>Share this link</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={lastInviteUrl} readOnly className="text-sm" />
                  <Button variant="outline" onClick={handleCopyInviteUrl}>
                    {copiedUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button className="w-full" onClick={() => {
                setLastInviteUrl(null)
                setInviteEmail("")
              }}>
                Invite Another
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="inviteEmail">Email Address</Label>
                  <Input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@company.com"
                  />
                </div>
                <div>
                  <Label htmlFor="inviteRole">Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as "ADMIN" | "MEMBER")}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBER">Member - Can view and log time</SelectItem>
                      {isOwner && (
                        <SelectItem value="ADMIN">Admin - Can also invite and manage members</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowInvite(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? "Sending..." : "Send Invitation"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Leave Confirmation */}
      <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Organization?</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave {organization.name}? You will lose access to shared projects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLeaveConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLeaveOrg} disabled={actionLoading}>
              {actionLoading ? "Leaving..." : "Leave Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {organization.name}? All members will be removed from the organization.
              Projects and time entries will remain but will no longer be shared.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteOrg} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete Organization"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog open={showRemoveMemberConfirm} onOpenChange={setShowRemoveMemberConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member?</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this member from the organization?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowRemoveMemberConfirm(false)
              setMemberToRemove(null)
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => memberToRemove && handleRemoveMember(memberToRemove)}>
              Remove Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Invitation Confirmation */}
      <Dialog open={showCancelInviteConfirm} onOpenChange={setShowCancelInviteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Invitation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this invitation?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCancelInviteConfirm(false)
              setInviteToCancel(null)
            }}>
              Keep Invitation
            </Button>
            <Button variant="destructive" onClick={() => inviteToCancel && handleCancelInvitation(inviteToCancel)}>
              Cancel Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
