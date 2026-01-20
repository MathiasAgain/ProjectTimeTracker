import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrgUserIds, getUserOrgId } from "@/lib/organization"

// Get time entries
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const userId = searchParams.get("userId")
    const allMembers = searchParams.get("allMembers") === "true"

    // Build where clause
    const where: Record<string, unknown> = {}

    // Get organization context
    const orgId = await getUserOrgId(session.user.id)

    if (allMembers && orgId) {
      // Show all organization members' entries
      const orgUserIds = await getOrgUserIds(session.user.id)
      where.userId = { in: orgUserIds }
    } else if (userId && userId !== session.user.id) {
      // Check if user can view other users' entries
      if (orgId) {
        // In org context, any member can view other members' entries
        const orgUserIds = await getOrgUserIds(session.user.id)
        if (!orgUserIds.includes(userId)) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }
        where.userId = userId
      } else {
        // Outside org, must be project owner
        const ownerCheck = await prisma.project.findFirst({
          where: {
            ownerId: session.user.id,
            members: {
              some: { userId }
            }
          }
        })
        if (!ownerCheck) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }
        where.userId = userId
      }
    } else {
      where.userId = session.user.id
    }

    if (projectId) {
      where.projectId = projectId
    }

    if (startDate || endDate) {
      where.startTime = {}
      if (startDate) {
        (where.startTime as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (where.startTime as Record<string, Date>).lte = new Date(endDate)
      }
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, color: true }
        },
        task: {
          select: { id: true, name: true }
        }
      },
      orderBy: { startTime: "desc" }
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error("Get time entries error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Create time entry (start timer)
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, taskId, description } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project is required" }, { status: 400 })
    }

    // Get user's organization ID
    const orgId = await getUserOrgId(session.user.id)

    // Verify user has access to project
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          // User owns the project
          { ownerId: session.user.id },
          // User is a project member
          { members: { some: { userId: session.user.id } } },
          // Project is in user's organization
          ...(orgId ? [{ organizationId: orgId }] : [])
        ]
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Check for existing running timer
    const runningEntry = await prisma.timeEntry.findFirst({
      where: {
        userId: session.user.id,
        endTime: null
      }
    })

    if (runningEntry) {
      return NextResponse.json(
        { error: "You already have a running timer" },
        { status: 400 }
      )
    }

    const entry = await prisma.timeEntry.create({
      data: {
        userId: session.user.id,
        projectId,
        taskId: taskId || null,
        description: description || null,
        startTime: new Date()
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Create time entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
