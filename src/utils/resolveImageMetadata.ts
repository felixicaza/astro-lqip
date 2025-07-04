export async function resolveImageMetadata(src: any) {
  if (typeof src === 'string') return null
  if ('then' in src && typeof src.then === 'function') return (await src).default
  if ('src' in src) return src
  return null
}
