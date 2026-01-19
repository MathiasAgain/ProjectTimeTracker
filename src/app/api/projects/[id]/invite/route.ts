import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"
import { sendInvitationEmail } from "@/lib/email"

// Invite member to project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId } = await params
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Verify user is project owner
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        ownerId: session.user.id
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      // Check if already a member
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          userId_projectId: {
            userId: existingUser.id,
            projectId
          }
        }
      })

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member" },
          { status: 400 }
        )
      }

      // Add as member directly
      await prisma.projectMember.create({
        data: {
          userId: existingUser.id,
          projectId,
          role: "MEMBER"
        }
      })

      return NextResponse.json({ message: "Member added successfully" })
    }

    // Create invitation for non-existing user
    const token = uuidv4()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

    const invitation = await prisma.invitation.create({
      data: {
        email,
        token,
        expiresAt,
        projectId,
        senderId: session.user.id
      }
    })

    // Build the full invite link
    const baseUrl = process.env.NEXTAUTH_URL || "https://project-time-tracker-blue.vercel.app"
    const inviteLink = `${baseUrl}/invite/${invitation.token}`

    // Get inviter name for the email
    const inviter = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true }
    })

    // Send invitation email
    const emailResult = await sendInvitationEmail({
      to: email,
      inviterName: inviter?.name || inviter?.email || "Someone",
      projectName: project.name,
      inviteLink
    })

    console.log(`Invitation link: ${inviteLink}`)
    console.log(`Email sent: ${emailResult.success}`)

    return NextResponse.json({
      message: emailResult.success ? "Invitation sent" : "Invitation created (email not sent)",
      inviteLink: `/invite/${invitation.token}`, // Return relative link for UI
      emailSent: emailResult.success,
      expiresAt: invitation.expiresAt
    })
  } catch (error) {
    console.error("Invite member error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
