"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Clock, Check, X } from "lucide-react"

export default function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)
  const router = useRouter()
  const { status } = useSession()
  const [invitation, setInvitation] = useState<{
    project: { name: string }
    sender: { name: string }
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchInvitation = async () => {
      try {
        const response = await fetch(`/api/invitations/${token}`)
        if (response.ok) {
          const data = await response.json()
          setInvitation(data)
        } else {
          setError("This invitation is invalid or has expired")
        }
      } catch {
        setError("Something went wrong")
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async () => {
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/invite/${token}`)
      return
    }

    setAccepting(true)
    try {
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST"
      })

      if (response.ok) {
        router.push("/projects")
      } else {
        const data = await response.json()
        setError(data.error || "Failed to accept invitation")
      }
    } catch {
      setError("Something went wrong")
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-destructive rounded-full">
                <X className="h-8 w-8 text-destructive-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl">Invalid Invitation</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary rounded-full">
              <Clock className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Project Invitation</CardTitle>
          <CardDescription>
            {invitation?.sender.name || "Someone"} has invited you to join
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{invitation?.project.name}</p>
          </div>

          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Decline
              </Button>
            </Link>
            <Button className="flex-1" onClick={handleAccept} disabled={accepting}>
              {accepting ? (
                "Accepting..."
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Accept
                </>
              )}
            </Button>
          </div>

          {status !== "authenticated" && (
            <p className="text-sm text-muted-foreground text-center">
              You&apos;ll need to sign in or create an account to accept this
              invitation.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
