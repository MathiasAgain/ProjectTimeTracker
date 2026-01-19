import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Accept invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { token } = await params

    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: "PENDING",
        expiresAt: {
          gt: new Date()
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found or expired" },
        { status: 404 }
      )
    }

    // Check if user is already a member
    const existingMember = await prisma.projectMember.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId: invitation.projectId
        }
      }
    })

    if (existingMember) {
      // Mark invitation as accepted anyway
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      })

      return NextResponse.json({ message: "Already a member" })
    }

    // Add user as member and mark invitation as accepted
    await prisma.$transaction([
      prisma.projectMember.create({
        data: {
          userId: session.user.id,
          projectId: invitation.projectId,
          role: "MEMBER"
        }
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" }
      })
    ])

    return NextResponse.json({ message: "Invitation accepted" })
  } catch (error) {
    console.error("Accept invitation error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
