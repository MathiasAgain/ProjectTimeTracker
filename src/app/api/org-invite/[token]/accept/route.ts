import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Accept organization invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Please log in to accept this invitation" }, { status: 401 })
    }

    const { token } = await params

    const invitation = await prisma.orgInvitation.findUnique({
      where: { token },
      include: {
        organization: true
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation has already been used" }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      // Mark as expired
      await prisma.orgInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" }
      })
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    // Check if user already belongs to an organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true, email: true }
    })

    if (user?.organizationId) {
      return NextResponse.json(
        { error: "You are already a member of an organization. Leave it first to join another." },
        { status: 400 }
      )
    }

    // Accept the invitation in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user to join organization
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          organizationId: invitation.organizationId,
          orgRole: invitation.role
        }
      })

      // Move user's existing projects to the organization
      await tx.project.updateMany({
        where: { ownerId: session.user.id },
        data: { organizationId: invitation.organizationId }
      })

      // Mark invitation as accepted
      await tx.orgInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      })
    })

    return NextResponse.json({
      success: true,
      organization: invitation.organization
    })
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
