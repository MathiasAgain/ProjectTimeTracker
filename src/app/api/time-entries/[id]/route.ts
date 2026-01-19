import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get single time entry
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    const entry = await prisma.timeEntry.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            project: {
              ownerId: session.user.id
            }
          }
        ]
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

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error("Get time entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Update time entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const { description, duration, startTime, endTime } = await request.json()

    // Check if user can edit this entry
    const entry = await prisma.timeEntry.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            project: {
              ownerId: session.user.id
            }
          }
        ]
      }
    })

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    if (description !== undefined) {
      updateData.description = description
    }

    if (duration !== undefined) {
      updateData.duration = duration
    }

    if (startTime) {
      updateData.startTime = new Date(startTime)
    }

    if (endTime) {
      updateData.endTime = new Date(endTime)
    }

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update time entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Delete time entry
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

    // Check if user can delete this entry
    const entry = await prisma.timeEntry.findFirst({
      where: {
        id,
        OR: [
          { userId: session.user.id },
          {
            project: {
              ownerId: session.user.id
            }
          }
        ]
      }
    })

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.timeEntry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete time entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
