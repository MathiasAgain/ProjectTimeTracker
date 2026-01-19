import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get recurring entries
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const entries = await prisma.recurringEntry.findMany({
      where: { userId: session.user.id },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Get recurring entries error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Create recurring entry
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      name,
      description,
      duration,
      billable,
      frequency,
      daysOfWeek,
      dayOfMonth,
      projectId,
      startDate,
      endDate
    } = await request.json()

    if (!name || !duration || !frequency || !projectId) {
      return NextResponse.json(
        { error: "Name, duration, frequency, and project are required" },
        { status: 400 }
      )
    }

    // Verify project access
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

    const entry = await prisma.recurringEntry.create({
      data: {
        name,
        description: description || null,
        duration,
        billable: billable ?? true,
        frequency,
        daysOfWeek: daysOfWeek || [],
        dayOfMonth: dayOfMonth || null,
        startDate: new Date(startDate || Date.now()),
        endDate: endDate ? new Date(endDate) : null,
        userId: session.user.id,
        projectId
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Create recurring entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
