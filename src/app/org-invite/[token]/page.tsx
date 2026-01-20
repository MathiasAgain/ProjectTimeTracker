"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Check, X } from "lucide-react"
import Link from "next/link"

interface InvitationData {
  organization: {
    name: string
  }
  sender: {
    name: string | null
    email: string
  }
  role: string
  email: string
}

export default function OrgInvitePage() {
  const params = useParams()
  const router = useRouter()
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/org-invite/${params.token}`)
        if (res.ok) {
          const data = await res.json()
          setInvitation(data)
        } else {
          const data = await res.json()
          setError(data.error || "Invalid or expired invitation")
        }
      } catch {
        setError("Failed to load invitation")
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [params.token])

  const handleAccept = async () => {
    setAccepting(true)
    setError(null)

    try {
      const res = await fetch(`/api/org-invite/${params.token}/accept`, {
        method: "POST"
      })

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/dashboard")
        }, 2000)
      } else {
        const data = await res.json()
        setError(data.error || "Failed to accept invitation")
      }
    } catch {
      setError("Failed to accept invitation")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <X className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invitation Invalid</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle>Welcome to {invitation?.organization.name}!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">Redirecting to dashboard...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Organization Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground">
              <strong>{invitation?.sender.name || invitation?.sender.email}</strong> has invited you to join
            </p>
            <p className="text-xl font-semibold">{invitation?.organization.name}</p>
            <p className="text-sm text-muted-foreground">
              as a{invitation?.role === "ADMIN" ? "n" : ""} <span className="font-medium">{invitation?.role}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={accepting}
            >
              {accepting ? "Accepting..." : "Accept Invitation"}
            </Button>
            <Link href="/dashboard" className="block">
              <Button variant="outline" className="w-full">
                Decline
              </Button>
            </Link>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By accepting, you&apos;ll join the organization and gain access to all shared projects and data.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
