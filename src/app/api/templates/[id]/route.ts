import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Delete template
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Check ownership
    const template = await prisma.timeTemplate.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.timeTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete template error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Use template (create time entry from template)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { date } = await request.json()

    // Get template
    const template = await prisma.timeTemplate.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Create time entry from template
    const baseDate = date ? new Date(date) : new Date()
    baseDate.setHours(9, 0, 0, 0)

    const entry = await prisma.timeEntry.create({
      data: {
        activity: template.activity || template.name,
        subtask: template.subtask || null,
        notes: template.description || null,
        tags: template.tags || [],
        description: template.description || template.name,
        startTime: baseDate,
        endTime: new Date(baseDate.getTime() + template.duration * 1000),
        duration: template.duration,
        billable: template.billable,
        userId: session.user.id,
        projectId: template.projectId
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Use template error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
