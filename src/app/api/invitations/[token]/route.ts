import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Get invitation details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invitation = await prisma.invitation.findFirst({
      where: {
        token,
        status: "PENDING",
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        project: {
          select: { name: true }
        },
        sender: {
          select: { name: true, email: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found or expired" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      project: invitation.project,
      sender: invitation.sender
    })
  } catch (error) {
    console.error("Get invitation error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
