import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get comments for a time entry
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: entryId } = await params

    const comments = await prisma.entryComment.findMany({
      where: { entryId },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Add comment to a time entry
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: entryId } = await params
    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    // Verify user has access to this entry's project
    const entry = await prisma.timeEntry.findUnique({
      where: { id: entryId },
      include: {
        project: {
          include: {
            members: true
          }
        }
      }
    })

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const isOwner = entry.project.ownerId === session.user.id
    const isMember = entry.project.members.some(m => m.userId === session.user.id)
    const isEntryOwner = entry.userId === session.user.id

    if (!isOwner && !isMember && !isEntryOwner) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const comment = await prisma.entryComment.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
        entryId
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Add comment error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
