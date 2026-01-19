import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Remove member from project
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: projectId, memberId } = await params

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

    // Get the member to check if they're the owner
    const member = await prisma.projectMember.findUnique({
      where: { id: memberId }
    })

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    if (member.role === "OWNER") {
      return NextResponse.json(
        { error: "Cannot remove project owner" },
        { status: 400 }
      )
    }

    await prisma.projectMember.delete({ where: { id: memberId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove member error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
