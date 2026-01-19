import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Update recurring entry
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
    const data = await request.json()

    // Check ownership
    const entry = await prisma.recurringEntry.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const updated = await prisma.recurringEntry.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        duration: data.duration,
        billable: data.billable,
        frequency: data.frequency,
        daysOfWeek: data.daysOfWeek,
        dayOfMonth: data.dayOfMonth,
        active: data.active,
        endDate: data.endDate ? new Date(data.endDate) : null
      },
      include: {
        project: {
          select: { id: true, name: true, color: true }
        }
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("Update recurring entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Delete recurring entry
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
    const entry = await prisma.recurringEntry.findFirst({
      where: { id, userId: session.user.id }
    })

    if (!entry) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    await prisma.recurringEntry.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete recurring entry error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
