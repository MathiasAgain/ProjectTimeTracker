import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get projects
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projects = await prisma.project.findMany({
      where: {
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } }
        ],
        archived: false
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        _count: {
          select: { timeEntries: true, tasks: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Create project
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, description, color } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const project = await prisma.project.create({
      data: {
        name,
        description: description || null,
        color: color || "#3B82F6",
        ownerId: session.user.id,
        members: {
          create: {
            userId: session.user.id,
            role: "OWNER"
          }
        }
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    // Create default templates for every new project
    await prisma.timeTemplate.createMany({
      data: [
        {
          name: "Meeting",
          activity: "Meeting",
          description: "Team meeting or client call",
          tags: ["meeting"],
          duration: 3600, // 1 hour
          billable: true,
          isDefault: true,
          userId: session.user.id,
          projectId: project.id
        },
        {
          name: "Quick Sync",
          activity: "Meeting",
          subtask: "Quick sync",
          description: "Short sync-up call",
          tags: ["meeting", "sync"],
          duration: 900, // 15 minutes
          billable: true,
          isDefault: true,
          userId: session.user.id,
          projectId: project.id
        }
      ]
    })

    // Create a daily standup recurring entry for the project
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    await prisma.recurringEntry.create({
      data: {
        name: "Daily Standup",
        activity: "Meeting",
        subtask: "Daily standup",
        description: "Daily team standup meeting",
        tags: ["meeting", "standup", "daily"],
        duration: 900, // 15 minutes
        billable: false,
        frequency: "WEEKLY",
        daysOfWeek: [1, 2, 3, 4, 5], // Monday to Friday
        startDate: today,
        active: true,
        userId: session.user.id,
        projectId: project.id
      }
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
