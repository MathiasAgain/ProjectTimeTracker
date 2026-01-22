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

    // If projectId is specified with allMembers, show all project members' entries
    if (projectId && allMembers) {
      // Verify user has access to this project
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
            ...(orgId ? [{ organizationId: orgId }] : [])
          ]
        },
        include: {
          members: { select: { userId: true } }
        }
      })

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
      }

      // Get all user IDs who can have entries in this project
      const projectUserIds = [project.ownerId, ...project.members.map(m => m.userId)]

      // If project belongs to an org, include all org members
      if (project.organizationId) {
        const org = await prisma.organization.findUnique({
          where: { id: project.organizationId },
          include: { members: { select: { id: true } } }
        })
        if (org) {
          org.members.forEach(m => {
            if (!projectUserIds.includes(m.id)) {
              projectUserIds.push(m.id)
            }
          })
        }
      }

      where.userId = { in: projectUserIds }
      where.projectId = projectId
    } else if (allMembers && orgId) {
      // Show all organization members' entries
      const orgUserIds = await getOrgUserIds(session.user.id)
      where.userId = { in: orgUserIds }
      if (projectId) {
        where.projectId = projectId
      }
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
      if (projectId) {
        where.projectId = projectId
      }
    } else {
      where.userId = session.user.id
      if (projectId) {
        where.projectId = projectId
      }
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
        },
        user: {
          select: { id: true, name: true, email: true }
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
