import type { ImagePath } from '../types'

export async function resolveImagePath(path: ImagePath) {
  // If it's a string, we can't resolve it here. ex: Remote images URLs
  if (typeof path === 'string') return null
  // Handle dynamic imports
  if ('then' in path && typeof path.then === 'function') return (await path).default
  if ('src' in path) return path
  return null
}
