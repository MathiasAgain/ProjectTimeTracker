import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get user's favorite projects
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const favorites = await prisma.favoriteProject.findMany({
      where: { userId: session.user.id },
      include: {
        project: {
          include: {
            _count: {
              select: { timeEntries: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return NextResponse.json(favorites.map(f => f.project))
  } catch (error) {
    console.error("Get favorites error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

// Toggle favorite status
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Check if already favorited
    const existing = await prisma.favoriteProject.findUnique({
      where: {
        userId_projectId: {
          userId: session.user.id,
          projectId
        }
      }
    })

    if (existing) {
      // Remove from favorites
      await prisma.favoriteProject.delete({
        where: { id: existing.id }
      })
      return NextResponse.json({ favorited: false })
    } else {
      // Add to favorites
      await prisma.favoriteProject.create({
        data: {
          userId: session.user.id,
          projectId
        }
      })
      return NextResponse.json({ favorited: true })
    }
  } catch (error) {
    console.error("Toggle favorite error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
