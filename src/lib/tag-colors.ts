// Predefined tag colors - consistent colors based on tag name hash
const TAG_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", color: "#3B82F6" },
  { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300", color: "#10B981" },
  { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300", color: "#F59E0B" },
  { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300", color: "#EF4444" },
  { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", color: "#8B5CF6" },
  { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", color: "#EC4899" },
  { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", color: "#6366F1" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300", color: "#06B6D4" },
  { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", color: "#F97316" },
  { bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300", color: "#14B8A6" },
]

// Simple hash function to get consistent color for a tag
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export function getTagColor(tag: string) {
  const index = hashString(tag.toLowerCase()) % TAG_COLORS.length
  return TAG_COLORS[index]
}

export function getTagClasses(tag: string) {
  const color = getTagColor(tag)
  return `${color.bg} ${color.text}`
}
