import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { isOrgAdmin } from "@/lib/organization"

// Delete/cancel a pending invitation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Get the invitation
    const invitation = await prisma.orgInvitation.findUnique({
      where: { id },
      include: {
        organization: {
          select: { ownerId: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    // Check if user has permission to cancel (must be org owner or admin)
    const isOwner = invitation.organization.ownerId === session.user.id
    const isAdmin = await isOrgAdmin(session.user.id)

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Only organization owners and admins can cancel invitations" }, { status: 403 })
    }

    // Delete the invitation
    await prisma.orgInvitation.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Cancel invitation error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
