import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Get invitation details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const invitation = await prisma.orgInvitation.findUnique({
      where: { token },
      include: {
        organization: {
          select: { name: true }
        },
        sender: {
          select: { name: true, email: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: "Invitation not found" }, { status: 404 })
    }

    if (invitation.status !== "PENDING") {
      return NextResponse.json({ error: "Invitation has already been used" }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invitation has expired" }, { status: 400 })
    }

    return NextResponse.json({
      organization: invitation.organization,
      sender: invitation.sender,
      role: invitation.role,
      email: invitation.email
    })
  } catch (error) {
    console.error("Get invitation error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
