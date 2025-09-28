export async function resolveImagePath(path: string | { src: string }) {
  // If it's a string, we can't resolve it here. ex: Remote images URLs
  if (typeof path === 'string') return null
  if ('src' in path) return path
  return null
}
