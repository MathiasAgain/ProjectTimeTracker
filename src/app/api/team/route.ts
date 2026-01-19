import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get team data for projects owned by user
export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    // Get projects owned by this user
    const ownedProjects = await prisma.project.findMany({
      where: { ownerId: session.user.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    if (ownedProjects.length === 0) {
      return NextResponse.json({
        projects: [],
        members: [],
        entries: [],
        summary: {
          totalHours: 0,
          billableHours: 0,
          totalValue: 0
        }
      })
    }

    const projectIds = ownedProjects.map((p) => p.id)

    // Get all members across owned projects
    const allMembers = new Map()
    ownedProjects.forEach((project) => {
      project.members.forEach((member) => {
        if (!allMembers.has(member.user.id)) {
          allMembers.set(member.user.id, {
            ...member.user,
            projects: []
          })
        }
        allMembers.get(member.user.id).projects.push({
          id: project.id,
          name: project.name,
          color: project.color
        })
      })
    })

    // Build date filter
    const dateFilter: Record<string, unknown> = {}
    if (startDate || endDate) {
      dateFilter.startTime = {}
      if (startDate) {
        (dateFilter.startTime as Record<string, Date>).gte = new Date(startDate)
      }
      if (endDate) {
        (dateFilter.startTime as Record<string, Date>).lte = new Date(endDate)
      }
    }

    // Get time entries for all owned projects
    const entries = await prisma.timeEntry.findMany({
      where: {
        projectId: { in: projectIds },
        endTime: { not: null },
        ...dateFilter
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true, color: true, hourlyRate: true }
        }
      },
      orderBy: { startTime: "desc" }
    })

    // Calculate summary
    let totalHours = 0
    let billableHours = 0
    let totalValue = 0

    entries.forEach((entry) => {
      const hours = (entry.duration || 0) / 3600
      totalHours += hours
      if (entry.billable) {
        billableHours += hours
        if (entry.project.hourlyRate) {
          totalValue += hours * entry.project.hourlyRate
        }
      }
    })

    // Calculate per-member stats
    const memberStats = new Map()
    entries.forEach((entry) => {
      const userId = entry.user.id
      if (!memberStats.has(userId)) {
        memberStats.set(userId, {
          totalSeconds: 0,
          billableSeconds: 0
        })
      }
      const stats = memberStats.get(userId)
      stats.totalSeconds += entry.duration || 0
      if (entry.billable) {
        stats.billableSeconds += entry.duration || 0
      }
    })

    const membersWithStats = Array.from(allMembers.values()).map((member) => ({
      ...member,
      stats: memberStats.get(member.id) || { totalSeconds: 0, billableSeconds: 0 }
    }))

    return NextResponse.json({
      projects: ownedProjects.map((p) => ({
        id: p.id,
        name: p.name,
        color: p.color,
        memberCount: p.members.length
      })),
      members: membersWithStats,
      recentEntries: entries.slice(0, 20),
      summary: {
        totalHours: Math.round(totalHours * 100) / 100,
        billableHours: Math.round(billableHours * 100) / 100,
        totalValue: Math.round(totalValue * 100) / 100
      }
    })
  } catch (error) {
    console.error("Get team data error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
