import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Get all members in the organization
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    })

    if (!user?.organizationId) {
      return NextResponse.json({ error: "Not a member of any organization" }, { status: 400 })
    }

    const members = await prisma.user.findMany({
      where: { organizationId: user.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        orgRole: true,
        createdAt: true,
        _count: {
          select: {
            timeEntries: true
          }
        }
      },
      orderBy: [
        { orgRole: "asc" }, // OWNER first, then ADMIN, then MEMBER
        { name: "asc" }
      ]
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
