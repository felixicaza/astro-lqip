import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { getPlaiceholder } from 'plaiceholder'

import type { ImagePath, ImportModule, ResolvedImage } from '../types'

import { PREFIX } from '../constants'

type RuntimePathConfig = {
  basePath: string
  assetsDir: string
}

const PROJECT_ROOT = process.cwd()
const SRC_DIR = join(PROJECT_ROOT, 'src')
const PUBLIC_DIR = join(PROJECT_ROOT, 'public')
const DIST_DIR = join(PROJECT_ROOT, 'dist')
const IS_DEV = import.meta.env?.MODE === 'development'

const STACK_PATH_REGEX = /(file:\/\/[^\s)]+|\/[^\s)]+|[A-Za-z]:[^\s)]+):\d+:\d+/
const IGNORED_STACK_SEGMENTS = [
  `${sep}node_modules${sep}`,
  `${sep}dist${sep}`,
  `${sep}.astro${sep}`,
  `${sep}.prerender${sep}`
]
const DIRS_IGNORED_IN_WALK = new Set(['node_modules', 'dist', '.astro'])
const ASTRO_CONFIG_CANDIDATES = [
  'astro.config.ts',
  'astro.config.mts',
  'astro.config.js',
  'astro.config.mjs',
  'astro.config.cjs'
]

const fileLookupCache = new Map<string, string | null>()
const stagedAssetCache = new Map<string, string | null>()
let runtimePathConfigPromise: Promise<RuntimePathConfig> | undefined

function warnFiles(filePath: string | undefined) {
  if (!filePath) return
  const lower = filePath.toLowerCase()
  if (lower.includes('/public/') || filePath.startsWith(PUBLIC_DIR)) {
    console.warn(`${PREFIX} Warning: image resolved from /public. Images should not be placed in /public - move them to /src so Astro can process them correctly.`)
  }
  if (lower.endsWith('.webp') || lower.endsWith('.avif')) {
    const format = lower.endsWith('.webp') ? 'webp' : 'avif'
    console.warn(`${PREFIX} Warning: image is in ${format} format. These formats are usually already optimized; using this component to re-process them may degrade quality.`)
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
  while (cur.startsWith('./') || cur.startsWith('../')) {
    cur = cur.startsWith('./') ? cur.slice(2) : cur.slice(3)
  }
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
      const srcCandidate = ensureInsideProject(join(SRC_DIR, trimmed))
      if (srcCandidate) out.add(srcCandidate)

      const publicCandidate = ensureInsideProject(join(PUBLIC_DIR, trimmed))
      if (publicCandidate) out.add(publicCandidate)
    }
  }

  if (normalized.startsWith('/src/')) out.add(join(PROJECT_ROOT, normalized.slice(1)))
  else if (normalized.startsWith('src/')) out.add(join(PROJECT_ROOT, normalized))

  if (normalized.startsWith('/public/')) out.add(join(PROJECT_ROOT, normalized.slice(1)))
  else if (normalized.startsWith('public/')) out.add(join(PROJECT_ROOT, normalized))

  if (!normalized.startsWith('/')) {
    const srcCandidate = ensureInsideProject(join(SRC_DIR, normalized))
    if (srcCandidate) out.add(srcCandidate)

    const rootCandidate = ensureInsideProject(join(PROJECT_ROOT, normalized))
    if (rootCandidate) out.add(rootCandidate)
  } else if (noLeading) {
    const rootCandidate = ensureInsideProject(join(PROJECT_ROOT, noLeading))
    if (rootCandidate) out.add(rootCandidate)
  }

  return Array.from(out)
}

async function walkSrcForFile(target: string) {
  if (!target) return null

  const key = SRC_DIR + '::' + target
  if (fileLookupCache.has(key)) return fileLookupCache.get(key) ?? null

  async function walk(dir: string): Promise<string | undefined> {
    let entries
    try {
      entries = await readdir(dir, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      const full = join(dir, entry.name)

      if (entry.isDirectory()) {
        if (DIRS_IGNORED_IN_WALK.has(entry.name)) continue
        const found = await walk(full)
        if (found) return found
      } else if (entry.name === target) {
        return full
      }
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
  return `/@fs${normalized}?origWidth=${String(width)}&origHeight=${String(height)}&origFormat=${format}`
}

function normalizeBasePath(input?: string) {
  const normalized = (input ?? '/').trim().replace(/\\/g, '/')
  if (!normalized || normalized === '/') return ''
  const stripped = normalized.replace(/^\/+|\/+$/g, '')
  return stripped ? `/${stripped}` : ''
}

function normalizeAssetsDir(input?: string) {
  const normalized = (input ?? '_astro').trim().replace(/\\/g, '/')
  const stripped = normalized.replace(/^\/+|\/+$/g, '')
  return stripped || '_astro'
}

function parseSimpleStringAssignment(source: string, key: string) {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(escapedKey + '\\s*:\\s*[\'"]([^\'"]+)[\'"]')
  const m = source.match(regex)
  return m?.[1]
}

function parseBasePathFromConfig(source: string) {
  return parseSimpleStringAssignment(source, 'base')
}

function parseAssetsDirFromConfig(source: string) {
  const buildBlock = source.match(/build\s*:\s*{([\s\S]*?)}/)
  if (!buildBlock?.[1]) return undefined
  return parseSimpleStringAssignment(buildBlock[1], 'assets')
}

async function resolveRuntimePathConfig(): Promise<RuntimePathConfig> {
  for (const relPath of ASTRO_CONFIG_CANDIDATES) {
    const absPath = join(PROJECT_ROOT, relPath)
    if (!existsSync(absPath)) continue

    try {
      const source = await readFile(absPath, 'utf-8')
      const basePath = normalizeBasePath(parseBasePathFromConfig(source))
      const assetsDir = normalizeAssetsDir(parseAssetsDirFromConfig(source))
      return { basePath, assetsDir }
    } catch {
      continue
    }
  }

  return { basePath: '', assetsDir: '_astro' }
}

function getRuntimePathConfig() {
  if (!runtimePathConfigPromise) {
    runtimePathConfigPromise = resolveRuntimePathConfig()
  }
  return runtimePathConfigPromise
}

function getPublicAssetPrefix(config: RuntimePathConfig) {
  return config.basePath
    ? `${config.basePath}/${config.assetsDir}`
    : `/${config.assetsDir}`
}

function getPublicAssetPath(fileName: string, config: RuntimePathConfig) {
  return (`${getPublicAssetPrefix(config)}/${fileName}`).replace(/\/{2,}/g, '/')
}

function getStageAssetSegments(config: RuntimePathConfig) {
  return [config.assetsDir]
}

function isSsrBuildLayoutPresent() {
  return (
    existsSync(join(DIST_DIR, 'server'))
    || existsSync(join(DIST_DIR, 'client'))
    || existsSync(join(DIST_DIR, 'server', '.prerender'))
  )
}

function getBuildStageDirs(config: RuntimePathConfig) {
  const segments = getStageAssetSegments(config)

  if (isSsrBuildLayoutPresent()) {
    return [join(DIST_DIR, 'server', '.prerender', ...segments)]
  }

  return [join(DIST_DIR, ...segments)]
}

async function ensureBuildAssetPublicPath(sourceFilePath: string) {
  if (stagedAssetCache.has(sourceFilePath)) return stagedAssetCache.get(sourceFilePath) ?? null

  try {
    const runtimeConfig = await getRuntimePathConfig()
    const st = await stat(sourceFilePath)
    const ext = extname(sourceFilePath).toLowerCase()
    const sourceBase = basename(sourceFilePath, ext)
    const digestInput = `${sourceFilePath}:${String(st.size)}:${String(st.mtimeMs)}`
    const digest = createHash('sha256').update(digestInput).digest('hex').slice(0, 8)
    const fileName = `${sourceBase}.${digest}${ext}`

    for (const dir of getBuildStageDirs(runtimeConfig)) {
      await mkdir(dir, { recursive: true })
      const targetAbs = join(dir, fileName)

      if (!existsSync(targetAbs)) {
        await copyFile(sourceFilePath, targetAbs)
      }
    }

    const publicPath = getPublicAssetPath(fileName, runtimeConfig)
    stagedAssetCache.set(sourceFilePath, publicPath)
    return publicPath
  } catch (err) {
    console.warn(`${PREFIX} Failed to stage build asset for "${sourceFilePath}".`, err)
    stagedAssetCache.set(sourceFilePath, null)
    return null
  }
}

async function createMetadataFromFile(filePath: string) {
  try {
    const buffer = await readFile(filePath)
    const placeholderResult = await getPlaiceholder(buffer, { size: 4 })
    const metadata = placeholderResult.metadata
    const width = metadata?.width ?? 0
    const height = metadata?.height ?? 0
    const format = normalizeFormat(metadata?.format, filePath)

    if (!width || !height || !format) {
      console.warn(`${PREFIX} Missing metadata for "${filePath}".`)
      return null
    }

    const src = IS_DEV
      ? toDevSrc(filePath, width, height, format)
      : await ensureBuildAssetPublicPath(filePath)

    if (!src) return null

    const imageMeta: ResolvedImage & { width: number, height: number, format: string } = {
      src,
      width,
      height,
      format
    }

    Object.defineProperty(imageMeta, 'fsPath', {
      value: filePath,
      enumerable: false,
      configurable: false,
      writable: false
    })

    return imageMeta
  } catch (err) {
    console.warn(`${PREFIX} Failed to derive metadata for "${filePath}".`, err)
    return null
  }
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

    const fsMatch = await resolveFromFileSystem(spec, callerDir)
    if (fsMatch) return fsMatch

    return null
  }

  return null
}
