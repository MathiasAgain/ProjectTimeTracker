import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Duplicate a time entry
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
    const { date } = await request.json() // Optional: new date for the entry

    // Get the original entry
    const original = await prisma.timeEntry.findUnique({
      where: { id: entryId }
    })

    if (!original) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    // Only allow duplicating own entries
    if (original.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Create new entry with same data but new date
    const startTime = date ? new Date(date) : new Date()
    startTime.setHours(9, 0, 0, 0) // Default to 9 AM

    const endTime = new Date(startTime.getTime() + (original.duration || 0) * 1000)

    const newEntry = await prisma.timeEntry.create({
      data: {
        activity: original.activity,
        subtask: original.subtask,
        notes: original.notes,
        tags: original.tags,
        description: original.description,
        startTime,
        endTime,
        duration: original.duration,
        billable: original.billable,
        userId: session.user.id,
        projectId: original.projectId,
        taskId: original.taskId
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(newEntry)
  } catch (error) {
    console.error("Duplicate entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
