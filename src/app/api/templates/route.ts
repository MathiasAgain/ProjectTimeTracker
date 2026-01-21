import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getOrgUserIds, getUserOrgId } from "@/lib/organization"

// Get templates
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get organization context
    const orgId = await getUserOrgId(session.user.id)

    let whereClause: { userId: string } | { userId: { in: string[] } }

    if (orgId) {
      // Show all organization members' templates
      const orgUserIds = await getOrgUserIds(session.user.id)
      whereClause = { userId: { in: orgUserIds } }
    } else {
      // Show only user's own templates
      whereClause = { userId: session.user.id }
    }

    const templates = await prisma.timeTemplate.findMany({
      where: whereClause,
      include: {
        project: {
          select: { id: true, name: true, color: true }
        },
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error("Get templates error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Create template
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, activity, subtask, description, tags, duration, billable, projectId } = await request.json()

    if (!name || !duration || !projectId) {
      return NextResponse.json(
        { error: "Name, duration, and project are required" },
        { status: 400 }
      )
    }

    // Get organization context
    const orgId = await getUserOrgId(session.user.id)

    // Verify project access
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
          ...(orgId ? [{ organizationId: orgId }] : [])
        ]
      }
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const template = await prisma.timeTemplate.create({
      data: {
        name,
        activity: activity || null,
        subtask: subtask || null,
        description: description || null,
        tags: tags || [],
        duration,
        billable: billable ?? true,
        userId: session.user.id,
        projectId
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error("Create template error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
