import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Create manual time entry
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, taskId, description, date, startTime, endTime, duration } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 })
    }

    // Verify user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ]
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Calculate start and end times
    let calculatedStartTime: Date
    let calculatedEndTime: Date
    let calculatedDuration: number

    if (startTime && endTime) {
      // If both start and end time provided, use them directly
      calculatedStartTime = new Date(startTime)
      calculatedEndTime = new Date(endTime)
      calculatedDuration = Math.floor((calculatedEndTime.getTime() - calculatedStartTime.getTime()) / 1000)
    } else if (duration) {
      // If duration provided (in seconds), calculate end time from start
      const baseDate = date ? new Date(date) : new Date()
      baseDate.setHours(9, 0, 0, 0) // Default to 9 AM
      calculatedStartTime = baseDate
      calculatedEndTime = new Date(baseDate.getTime() + duration * 1000)
      calculatedDuration = duration
    } else {
      return NextResponse.json(
        { error: "Either duration or start/end time is required" },
        { status: 400 }
      )
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        projectId,
        taskId: taskId || null,
        description: description || null,
        startTime: calculatedStartTime,
        endTime: calculatedEndTime,
        duration: calculatedDuration
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        },
        task: {
          select: { id: true, name: true }
        }
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Create manual time entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
