import { prisma } from "@/lib/prisma"

// Get user with organization info
export async function getUserWithOrg(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      organization: true
    }
  })
}

// Check if user is admin or owner of their organization
export async function isOrgAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { orgRole: true, organizationId: true }
  })

  if (!user || !user.organizationId) return false
  return user.orgRole === "OWNER" || user.orgRole === "ADMIN"
}

// Check if user is owner of their organization
export async function isOrgOwner(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { orgRole: true, organizationId: true }
  })

  if (!user || !user.organizationId) return false
  return user.orgRole === "OWNER"
}

// Get all user IDs in the same organization (for querying shared data)
export async function getOrgUserIds(userId: string): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  })

  if (!user?.organizationId) {
    // No organization - only return the user's own ID
    return [userId]
  }

  // Get all users in the organization
  const orgUsers = await prisma.user.findMany({
    where: { organizationId: user.organizationId },
    select: { id: true }
  })

  return orgUsers.map(u => u.id)
}

// Get organization ID for a user (or null if not in an org)
export async function getUserOrgId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { organizationId: true }
  })

  return user?.organizationId || null
}
