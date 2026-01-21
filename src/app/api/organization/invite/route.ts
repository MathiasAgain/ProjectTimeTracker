import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Get pending invitations
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, orgRole: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 400 })
    }

    if (user.orgRole !== "OWNER" && user.orgRole !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can view invitations" }, { status: 403 })
    }

    const invitations = await prisma.orgInvitation.findMany({
      where: {
        organizationId: user.organizationId,
        status: "PENDING"
      },
      include: {
        sender: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(invitations)
  } catch (error) {
    console.error("Get invitations error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Send invitation to join organization
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { email, role = "MEMBER" } = await request.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!["ADMIN", "MEMBER"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Get current user's org and role
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        organization: true
      }
    })

    if (!currentUser?.organizationId || !currentUser.organization) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 400 })
    }

    if (currentUser.orgRole !== "OWNER" && currentUser.orgRole !== "ADMIN") {
      return NextResponse.json({ error: "Only admins can invite members" }, { status: 403 })
    }

    // Only owner can invite as admin
    if (role === "ADMIN" && currentUser.orgRole !== "OWNER") {
      return NextResponse.json({ error: "Only the owner can invite admins" }, { status: 403 })
    }

    // Check if user is already in the organization
    const existingMember = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: currentUser.organizationId
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this organization" }, { status: 400 })
    }

    // Check for existing pending invitation
    const existingInvite = await prisma.orgInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: currentUser.organizationId,
        status: "PENDING"
      }
    })

    if (existingInvite) {
      return NextResponse.json({ error: "Invitation already sent to this email" }, { status: 400 })
    }

    // Create invitation
    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await prisma.orgInvitation.create({
      data: {
        email: email.toLowerCase(),
        token,
        role,
        expiresAt,
        organizationId: currentUser.organizationId,
        senderId: session.user.id
      }
    })

    // Send email if Resend is configured
    const inviteUrl = `${process.env.NEXTAUTH_URL || "https://project-time-tracker-blue.vercel.app"}/org-invite/${token}`

    if (resend) {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
          to: email,
          subject: `Join ${currentUser.organization.name} on TimeTracker`,
          html: `
            <h2>You've been invited to join ${currentUser.organization.name}</h2>
            <p>${currentUser.name || currentUser.email} has invited you to join their organization on TimeTracker.</p>
            <p>Click the link below to accept the invitation:</p>
            <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 6px;">Accept Invitation</a></p>
            <p>Or copy this link: ${inviteUrl}</p>
            <p>This invitation expires in 7 days.</p>
          `
        })
      } catch (emailError) {
        console.error("Failed to send invitation email:", emailError)
      }
    }

    return NextResponse.json({
      ...invitation,
      inviteUrl // Return URL for manual sharing if email fails
    }, { status: 201 })
  } catch (error) {
    console.error("Send invitation error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
