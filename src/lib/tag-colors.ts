// Predefined tags with assigned colors
export const PREDEFINED_TAGS = [
  { name: "development", bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  { name: "design", bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300" },
  { name: "meeting", bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-300" },
  { name: "research", bg: "bg-cyan-100 dark:bg-cyan-900/30", text: "text-cyan-700 dark:text-cyan-300" },
  { name: "planning", bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300" },
  { name: "review", bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300" },
  { name: "testing", bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-700 dark:text-green-300" },
  { name: "documentation", bg: "bg-teal-100 dark:bg-teal-900/30", text: "text-teal-700 dark:text-teal-300" },
  { name: "bugfix", bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-700 dark:text-red-300" },
  { name: "support", bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300" },
  { name: "admin", bg: "bg-gray-100 dark:bg-gray-900/30", text: "text-gray-700 dark:text-gray-300" },
  { name: "learning", bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
] as const

// Get all predefined tag names
export const VALID_TAGS: string[] = PREDEFINED_TAGS.map(t => t.name)

// Get tag color classes by name
export function getTagClasses(tag: string): string {
  const predefinedTag = PREDEFINED_TAGS.find(t => t.name === tag.toLowerCase())
  if (predefinedTag) {
    return `${predefinedTag.bg} ${predefinedTag.text}`
  }
  // Fallback for any legacy tags not in predefined list
  return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300"
}

// Validate if a tag is in the predefined list
export function isValidTag(tag: string): boolean {
  return VALID_TAGS.includes(tag.toLowerCase())
}

// Filter to only valid tags
export function filterValidTags(tags: string[]): string[] {
  return tags.filter(tag => isValidTag(tag))
}
