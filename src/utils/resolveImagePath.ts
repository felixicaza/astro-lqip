import { existsSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPlaiceholder } from 'plaiceholder'

import type { ImagePath, ImportModule, ResolvedImage } from '../types'

import { PREFIX } from '../constants'

const PROJECT_ROOT = process.cwd()
const SRC_DIR = join(PROJECT_ROOT, 'src')
const PUBLIC_DIR = join(PROJECT_ROOT, 'public')
const DIST_DIR = join(PROJECT_ROOT, 'dist')
const IS_DEV = import.meta.env?.MODE === 'development'

const STACK_PATH_REGEX = /(file:\/\/[^\s)]+|\/[^\s)]+|[A-Za-z]:[^\s)]+):\d+:\d+/
const IGNORED_STACK_SEGMENTS = [`${sep}node_modules${sep}`, `${sep}dist${sep}`, `${sep}.astro${sep}`, `${sep}.prerender${sep}`]
const DIRS_IGNORED_IN_WALK = new Set(['node_modules', 'dist', '.astro'])
const DIRS_IGNORED_IN_DIST_WALK = new Set(['.astro', '.vite'])

const LOCAL_IMAGE_MODULES = import.meta.glob('/src/**/*.{jpg,jpeg,png,webp,avif,svg,gif}')

const fileLookupCache = new Map<string, string | null>()
const distAssetBySourceCache = new Map<string, string | null>()

function warnFiles(filePath: string | undefined) {
  if (!filePath) return
  const lower = filePath.toLowerCase()
  if (lower.includes('/public/') || filePath.startsWith(PUBLIC_DIR)) {
    console.warn(`${PREFIX} Warning: image resolved from /public. Images should not be placed in /public - move them to /src so Astro can process them correctly.`)
  }
  if (lower.endsWith('.webp') || lower.endsWith('.avif')) {
    console.warn(`${PREFIX} Warning: image is in ${lower.endsWith('.webp') ? 'webp' : 'avif'} format. These formats are usually already optimized; using this component to re-process them may degrade quality.`)
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isPromise(v: unknown): v is Promise<unknown> {
  return isObject(v) && typeof (v as { then?: unknown }).then === 'function'
}

function hasSrc(v: unknown): v is ResolvedImage {
  return isObject(v) && typeof (v as Record<string, unknown>).src === 'string'
}

function isRemoteUrl(v: string) {
  return /^https?:\/\//.test(v)
}

function stripQueryAndHash(path: string) {
  const q = path.indexOf('?')
  const h = path.indexOf('#')
  let end = path.length
  if (q !== -1) end = Math.min(end, q)
  if (h !== -1) end = Math.min(end, h)
  return path.slice(0, end)
}

function normalizeSpecifier(input: string) {
  const t = stripQueryAndHash(input.trim()).replace(/\\/g, '/')
  if (t.startsWith('@/')) return `src/${t.slice(2)}`
  if (t.startsWith('~@/')) return `src/${t.slice(3)}`
  return t
}

function isRelativeSpecifier(path: string) {
  return path.startsWith('./') || path.startsWith('../')
}

function stripLeadingRelativeSegments(path: string) {
  let cur = path
  while (cur.startsWith('./') || cur.startsWith('../')) cur = cur.startsWith('./') ? cur.slice(2) : cur.slice(3)
  return cur
}

function extractPathFromStackLine(line: string) {
  const m = line.match(STACK_PATH_REGEX)
  if (!m?.[1]) return null
  const raw = m[1]
  if (!raw.startsWith('file://')) return raw
  try {
    return fileURLToPath(raw)
  } catch {
    return raw.replace(/^file:\/\//, '')
  }
}

function isUserFilePath(candidate: string) {
  if (!candidate) return false
  if (!candidate.startsWith('/') && !/^[A-Za-z]:/.test(candidate)) return false
  if (!candidate.startsWith(PROJECT_ROOT)) return false
  return !IGNORED_STACK_SEGMENTS.some((s) => candidate.includes(s))
}

function getCallerDirectory() {
  const stack = new Error().stack
  if (!stack) return null
  for (const line of stack.split('\n').slice(2)) {
    const file = extractPathFromStackLine(line)
    if (file && isUserFilePath(file)) return dirname(file)
  }
  return null
}

function ensureInsideProject(candidate: string) {
  const rel = relative(PROJECT_ROOT, candidate)
  if (!candidate || rel.startsWith('..') || rel.includes(`..${sep}`) || rel.includes('node_modules')) return null
  return candidate
}

function toProjectKey(filePath: string) {
  const rel = relative(PROJECT_ROOT, filePath).replace(/\\/g, '/')
  return !rel || rel.startsWith('../') ? null : `/${rel}`
}

function collectModuleCandidates(specifier: string, callerDir: string | null) {
  const normalized = normalizeSpecifier(specifier)
  const out = new Set<string>()

  if (normalized.startsWith('/src/')) out.add(normalized)
  else if (normalized.startsWith('src/')) out.add(`/${normalized}`)

  if (callerDir && isRelativeSpecifier(normalized)) {
    const fromCaller = toProjectKey(resolvePath(callerDir, normalized))
    if (fromCaller?.startsWith('/src/')) out.add(fromCaller)
  }

  if (isRelativeSpecifier(normalized)) {
    const trimmed = stripLeadingRelativeSegments(normalized)
    if (trimmed) out.add(trimmed.startsWith('src/') ? `/${trimmed}` : `/src/${trimmed}`)
    const suffix = `/${trimmed}`
    for (const key of Object.keys(LOCAL_IMAGE_MODULES)) if (key.endsWith(suffix)) out.add(key)
  }

  if (!normalized.startsWith('/') && !normalized.startsWith('src/') && !isRelativeSpecifier(normalized)) out.add(`/src/${normalized}`)
  return Array.from(out)
}

function collectFsCandidates(specifier: string, callerDir: string | null) {
  const normalized = normalizeSpecifier(specifier)
  const out = new Set<string>()
  const noLeading = normalized.startsWith('/') ? normalized.slice(1) : normalized

  if (callerDir && isRelativeSpecifier(normalized)) {
    const resolved = ensureInsideProject(resolvePath(callerDir, normalized))
    if (resolved) out.add(resolved)
  }

  if (isRelativeSpecifier(normalized)) {
    const trimmed = stripLeadingRelativeSegments(normalized)
    if (trimmed) {
      const srcC = ensureInsideProject(join(SRC_DIR, trimmed))
      if (srcC) out.add(srcC)
      const pubC = ensureInsideProject(join(PUBLIC_DIR, trimmed))
      if (pubC) out.add(pubC)
    }
  }

  if (normalized.startsWith('/src/')) out.add(join(PROJECT_ROOT, normalized.slice(1)))
  else if (normalized.startsWith('src/')) out.add(join(PROJECT_ROOT, normalized))

  if (normalized.startsWith('/public/')) out.add(join(PROJECT_ROOT, normalized.slice(1)))
  else if (normalized.startsWith('public/')) out.add(join(PROJECT_ROOT, normalized))

  if (!normalized.startsWith('/')) {
    const srcC = ensureInsideProject(join(SRC_DIR, normalized))
    if (srcC) out.add(srcC)
    const rootC = ensureInsideProject(join(PROJECT_ROOT, normalized))
    if (rootC) out.add(rootC)
  } else if (noLeading) {
    const rootC = ensureInsideProject(join(PROJECT_ROOT, noLeading))
    if (rootC) out.add(rootC)
  }

  return Array.from(out)
}

async function walkSrcForFile(target: string) {
  if (!target) return null
  const key = `${SRC_DIR}::${target}`
  if (fileLookupCache.has(key)) return fileLookupCache.get(key) ?? null

  async function walk(dir: string): Promise<string | undefined> {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch { return }
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        if (DIRS_IGNORED_IN_WALK.has(e.name)) continue
        const found = await walk(full)
        if (found) return found
      } else if (e.name === target) return full
    }
  }

  const found = await walk(SRC_DIR)
  fileLookupCache.set(key, found ?? null)
  return found ?? null
}

function normalizeFormat(format: string | number | symbol | undefined, filePath: string) {
  if (format != null) return String(format).toLowerCase()
  const ext = extname(filePath).replace('.', '')
  return ext ? ext.toLowerCase() : undefined
}

function toDevSrc(filePath: string, width: number, height: number, format: string) {
  const normalized = filePath.replace(/\\/g, '/')
  return `/@fs${normalized}?origWidth=${width}&origHeight=${height}&origFormat=${format}`
}

function matchesBuildAsset(sourceFilePath: string, emittedFileName: string) {
  const sourceBase = basename(sourceFilePath)
  if (emittedFileName === sourceBase) return true
  const sourceExt = extname(sourceBase)
  const sourceName = sourceExt ? sourceBase.slice(0, -sourceExt.length) : sourceBase
  return emittedFileName.startsWith(`${sourceName}.`) && emittedFileName.endsWith(sourceExt)
}

function toPublicPathFromDist(foundAbs: string) {
  const normalized = foundAbs.replace(/\\/g, '/')
  const prerenderMarker = '.prerender/'
  const astroMarker = '/_astro/'

  const astroIdx = normalized.lastIndexOf(astroMarker)
  if (astroIdx !== -1) return normalized.slice(astroIdx)

  const relDist = relative(DIST_DIR, foundAbs).replace(/\\/g, '/')
  const preIdx = relDist.indexOf(prerenderMarker)
  if (preIdx !== -1) return `/${relDist.slice(preIdx + prerenderMarker.length)}`

  return `/${relDist}`
}

async function findBuildAssetPublicPath(sourceFilePath: string) {
  if (distAssetBySourceCache.has(sourceFilePath)) return distAssetBySourceCache.get(sourceFilePath) ?? null
  if (!existsSync(DIST_DIR)) {
    distAssetBySourceCache.set(sourceFilePath, null)
    return null
  }

  async function walk(dir: string): Promise<string | undefined> {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch { return }
    for (const e of entries) {
      const full = join(dir, e.name)
      if (e.isDirectory()) {
        if (DIRS_IGNORED_IN_DIST_WALK.has(e.name)) continue
        const nested = await walk(full)
        if (nested) return nested
      } else if (matchesBuildAsset(sourceFilePath, e.name)) {
        return full
      }
    }
  }

  const found = await walk(DIST_DIR)
  if (!found) {
    distAssetBySourceCache.set(sourceFilePath, null)
    return null
  }

  const publicPath = toPublicPathFromDist(found)
  distAssetBySourceCache.set(sourceFilePath, publicPath)
  return publicPath
}

async function createMetadataFromFile(filePath: string) {
  try {
    const buffer = await readFile(filePath)
    const { metadata } = await getPlaiceholder(buffer, { size: 4 })
    const width = metadata?.width ?? 0
    const height = metadata?.height ?? 0
    const format = normalizeFormat(metadata?.format, filePath)

    if (!width || !height || !format) {
      console.warn(`${PREFIX} Missing metadata for "${filePath}".`)
      return null
    }

    const src = IS_DEV ? toDevSrc(filePath, width, height, format) : await findBuildAssetPublicPath(filePath)
    if (!src) return null

    const imageMeta: ResolvedImage & { width: number, height: number, format: string } = { src, width, height, format }
    Object.defineProperty(imageMeta, 'fsPath', { value: filePath, enumerable: false, configurable: false, writable: false })
    return imageMeta
  } catch (err) {
    console.warn(`${PREFIX} Failed to derive metadata for "${filePath}".`, err)
    return null
  }
}

async function resolveFromModuleMap(specifier: string, callerDir: string | null) {
  const candidates = collectModuleCandidates(specifier, callerDir)
  for (const key of candidates) {
    const loader = LOCAL_IMAGE_MODULES[key]
    if (!loader) continue
    const mod = await loader() as ImportModule
    const resolved = (mod.default ?? mod) as unknown
    if (!hasSrc(resolved)) continue
    warnFiles((resolved as ResolvedImage).src)
    return resolved as ResolvedImage
  }
  return null
}

async function resolveFromFileSystem(specifier: string, callerDir: string | null) {
  const candidates = collectFsCandidates(specifier, callerDir)

  for (const candidate of candidates) {
    if (!candidate || !existsSync(candidate)) continue
    const metadata = await createMetadataFromFile(candidate)
    if (!metadata) continue
    warnFiles(candidate)
    return metadata as ResolvedImage
  }

  const fileName = normalizeSpecifier(specifier).split('/').pop()
  if (!fileName) return null

  const fallback = await walkSrcForFile(fileName)
  if (!fallback || !existsSync(fallback)) return null

  const metadata = await createMetadataFromFile(fallback)
  if (!metadata) return null

  warnFiles(fallback)
  return metadata as ResolvedImage
}

export async function resolveImagePath(path: ImagePath) {
  if (path == null) return null

  if (isPromise(path)) {
    const mod = await (path as Promise<ImportModule>)
    const resolved = (mod.default ?? mod) as unknown
    if (hasSrc(resolved)) {
      warnFiles((resolved as ResolvedImage).src)
      return resolved
    }
    if (typeof resolved === 'string') {
      warnFiles(resolved)
      return resolved
    }
    return null
  }

  if (isObject(path)) {
    const obj = path as Record<string, unknown>
    const objSrc = typeof obj.src === 'string' ? obj.src : undefined
    warnFiles(objSrc)
    return hasSrc(obj) ? (obj as ResolvedImage) : null
  }

  if (typeof path === 'string') {
    if (isRemoteUrl(path)) return path
    const spec = normalizeSpecifier(path)
    const callerDir = isRelativeSpecifier(spec) ? getCallerDirectory() : null

    const moduleMatch = await resolveFromModuleMap(spec, callerDir)
    if (moduleMatch) return moduleMatch

    const fsMatch = await resolveFromFileSystem(spec, callerDir)
    if (fsMatch) return fsMatch

    return null
  }

  return null
}
