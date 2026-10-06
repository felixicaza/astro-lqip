import type { ImageMetadata } from 'astro'
import type { ImagePath, ImportModule, ResolvedImage, ResolvedImageSource } from '../types/index.ts'

import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { access, copyFile, mkdir, readFile, readdir, stat } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve as resolvePath, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { loadPreviewly } from './loadPreviewly.ts'

import { PREFIX } from '../constants/index.ts'

interface RuntimePathConfig {
  basePath: string
  assetsDir: string
}

const PROJECT_ROOT = process.cwd()
const SRC_DIR = join(PROJECT_ROOT, 'src')
const PUBLIC_DIR = join(PROJECT_ROOT, 'public')
const DIST_DIR = join(PROJECT_ROOT, 'dist')
const IS_DEV = import.meta.env?.MODE === 'development'

const IS_REMOTE_URL_REGEX = /^https?:\/\//
const IS_FILE_REGEX = /^file:\/\//
const FILENAME_REGEX = /^[A-Za-z]:/
const BUILD_SOURCE_REGEX = /build\s*:\s*{([\s\S]*?)}/
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
const ASTRO_IMAGE_FORMATS = [
  'avif',
  'png',
  'webp',
  'jpeg',
  'jpg',
  'svg',
  'tiff',
  'gif'
] as const satisfies readonly ImageMetadata['format'][]

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

function isRemoteUrl(v: string) {
  return IS_REMOTE_URL_REGEX.test(v)
}

async function fileExists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
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
    return raw.replace(IS_FILE_REGEX, '')
  }
}

function isUserFilePath(candidate: string) {
  if (!candidate) return false
  if (!candidate.startsWith('/') && !FILENAME_REGEX.test(candidate)) return false
  if (!candidate.startsWith(PROJECT_ROOT)) return false
  return !IGNORED_STACK_SEGMENTS.some((s) => candidate.includes(s))
}

function getCallerDirectory() {
  const stack = new Error('error').stack
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

function addCandidate(out: Set<string>, candidate: string | null | undefined) {
  if (candidate) {
    out.add(candidate)
  }
}

function collectCallerRelativeCandidate(normalized: string, callerDir: string | null, out: Set<string>) {
  if (!callerDir || !isRelativeSpecifier(normalized)) return

  addCandidate(out, ensureInsideProject(resolvePath(callerDir, normalized)))
}

function collectRelativeDirectoryCandidates(normalized: string, out: Set<string>) {
  if (!isRelativeSpecifier(normalized)) return

  const trimmed = stripLeadingRelativeSegments(normalized)
  if (!trimmed) return

  addCandidate(out, ensureInsideProject(join(SRC_DIR, trimmed)))
  addCandidate(out, ensureInsideProject(join(PUBLIC_DIR, trimmed)))
}

function collectExplicitDirectoryCandidates(normalized: string, out: Set<string>) {
  if (normalized.startsWith('/src/')) {
    addCandidate(out, join(PROJECT_ROOT, normalized.slice(1)))
  } else if (normalized.startsWith('src/')) {
    addCandidate(out, join(PROJECT_ROOT, normalized))
  }

  if (normalized.startsWith('/public/')) {
    addCandidate(out, join(PROJECT_ROOT, normalized.slice(1)))
  } else if (normalized.startsWith('public/')) {
    addCandidate(out, join(PROJECT_ROOT, normalized))
  }
}

function collectNonAbsoluteCandidates(normalized: string, out: Set<string>) {
  if (normalized.startsWith('/')) {
    const noLeading = normalized.slice(1)

    if (noLeading) {
      addCandidate(out, ensureInsideProject(join(PROJECT_ROOT, noLeading)))
    }

    return
  }

  addCandidate(out, ensureInsideProject(join(SRC_DIR, normalized)))
  addCandidate(out, ensureInsideProject(join(PROJECT_ROOT, normalized)))
}

function collectFsCandidates(specifier: string, callerDir: string | null) {
  const normalized = normalizeSpecifier(specifier)
  const out = new Set<string>()

  collectCallerRelativeCandidate(normalized, callerDir, out)
  collectRelativeDirectoryCandidates(normalized, out)
  collectExplicitDirectoryCandidates(normalized, out)
  collectNonAbsoluteCandidates(normalized, out)

  return [...out]
}

async function walkSrcForFile(target: string) {
  if (!target) return null

  const key = `${SRC_DIR}::${target}`
  if (fileLookupCache.has(key)) return fileLookupCache.get(key) ?? null

  async function walk(dir: string): Promise<string | undefined> {
    let entries
    try { entries = await readdir(dir, { withFileTypes: true }) } catch { return }

    const directories = entries.filter(entry => entry.isDirectory() && !DIRS_IGNORED_IN_WALK.has(entry.name))

    const file = entries.find(entry => !entry.isDirectory() && entry.name === target)
    if (file) return join(dir, file.name)

    const results = await Promise.all(directories.map(entry => walk(join(dir, entry.name))))
    return results.find(Boolean)
  }

  const found = await walk(SRC_DIR)
  fileLookupCache.set(key, found ?? null)
  return found ?? null
}

function normalizeFormat(format: string | number | symbol | undefined, filePath: string): ImageMetadata['format'] | undefined {
  const candidate = format == null ? extname(filePath).slice(1).toLowerCase() : String(format).toLowerCase()
  return ASTRO_IMAGE_FORMATS.find((supportedFormat) => supportedFormat === candidate)
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
  const regex = new RegExp(`${escapedKey}\\s*:\\s*['"]([^'"]+)['"]`)
  const m = source.match(regex)
  return m?.[1]
}

function parseBasePathFromConfig(source: string) {
  return parseSimpleStringAssignment(source, 'base')
}

function parseAssetsDirFromConfig(source: string) {
  const buildBlock = source.match(BUILD_SOURCE_REGEX)
  if (!buildBlock?.[1]) return undefined
  return parseSimpleStringAssignment(buildBlock[1], 'assets')
}

async function resolveRuntimePathConfig(): Promise<RuntimePathConfig> {
  const resolve = async(index: number): Promise<RuntimePathConfig> => {
    if (index >= ASTRO_CONFIG_CANDIDATES.length) return { basePath: '', assetsDir: '_astro' }

    const relPath = ASTRO_CONFIG_CANDIDATES[index]

    try {
      const source = await readFile(join(PROJECT_ROOT, relPath), 'utf-8')
      const basePath = normalizeBasePath(parseBasePathFromConfig(source))
      const assetsDir = normalizeAssetsDir(parseAssetsDirFromConfig(source))

      return { basePath, assetsDir }
    } catch {
      return resolve(index + 1)
    }
  }

  return resolve(0)
}

function getRuntimePathConfig() {
  runtimePathConfigPromise ||= resolveRuntimePathConfig()
  return runtimePathConfigPromise
}

function getPublicAssetPrefix(config: RuntimePathConfig) {
  return config.basePath ? `${config.basePath}/${config.assetsDir}` : `/${config.assetsDir}`
}

function getPublicAssetPath(fileName: string, config: RuntimePathConfig) {
  return (`${getPublicAssetPrefix(config)}/${fileName}`).replace(/\/{2,}/g, '/')
}

function getStageAssetSegments(config: RuntimePathConfig) {
  return [config.assetsDir]
}

async function isSsrBuildLayoutPresent() {
  const paths = [
    join(DIST_DIR, 'server'),
    join(DIST_DIR, 'client'),
    join(DIST_DIR, 'server', '.prerender')
  ]

  const results = await Promise.all(paths.map(fileExists))
  return results.some(Boolean)
}

async function getBuildStageDirs(config: RuntimePathConfig) {
  const segments = getStageAssetSegments(config)
  if (await isSsrBuildLayoutPresent()) return [join(DIST_DIR, 'server', '.prerender', ...segments)]
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
    const buildStageDirs = await getBuildStageDirs(runtimeConfig)

    await Promise.all(
      buildStageDirs.map(async(dir) => {
        await mkdir(dir, { recursive: true })
        const targetAbs = join(dir, fileName)

        try {
          await copyFile(sourceFilePath, targetAbs, constants.COPYFILE_EXCL)
        } catch(error) {
          if (error instanceof Error && 'code' in error && error.code === 'EEXIST') return
          throw error
        }
      })
    )

    const publicPath = getPublicAssetPath(fileName, runtimeConfig)
    stagedAssetCache.set(sourceFilePath, publicPath)
    return publicPath
  } catch(error) {
    console.warn(`${PREFIX} Failed to stage build asset for "${sourceFilePath}".`, error)
    stagedAssetCache.set(sourceFilePath, null)
    return null
  }
}

async function createMetadataFromFile(filePath: string) {
  try {
    const buffer = await readFile(filePath)
    const { getPreviewly } = await loadPreviewly()
    const previewlyResult = await getPreviewly(buffer, { size: 4 })
    const metadata = previewlyResult.metadata
    const width = metadata?.originalWidth ?? 0
    const height = metadata?.originalHeight ?? 0
    const format = normalizeFormat(metadata?.originalFormat, filePath)

    if (!width || !height || !format) {
      console.warn(`${PREFIX} Missing metadata for "${filePath}".`)
      return null
    }

    const src = IS_DEV ? toDevSrc(filePath, width, height, format) : await ensureBuildAssetPublicPath(filePath)
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
  } catch(error) {
    console.warn(`${PREFIX} Failed to derive metadata for "${filePath}".`, error)
    return null
  }
}

async function resolveFromFileSystem(specifier: string, callerDir: string | null) {
  const candidates = collectFsCandidates(specifier, callerDir)

  async function resolveCandidate(index: number): Promise<ResolvedImage | null> {
    if (index >= candidates.length) return null
    const candidate = candidates[index]
    if (!candidate) return resolveCandidate(index + 1)
    const metadata = await createMetadataFromFile(candidate)
    if (!metadata) return resolveCandidate(index + 1)

    warnFiles(candidate)
    return metadata
  }

  const resolved = await resolveCandidate(0)
  if (resolved) return resolved

  const fileName = normalizeSpecifier(specifier).split('/').pop()
  if (!fileName) return null

  const fallback = await walkSrcForFile(fileName)
  if (!fallback) return null

  const metadata = await createMetadataFromFile(fallback)
  if (!metadata) return null

  warnFiles(fallback)
  return metadata
}

async function resolvePromiseImagePath(path: Promise<ImportModule>) {
  const { default: resolved } = await path
  warnFiles(resolved.src)
  return resolved
}

function resolveObjectImagePath(path: ResolvedImage) {
  warnFiles(path.src)
  return path
}

async function resolveStringImagePath(path: string) {
  if (isRemoteUrl(path)) return path

  const spec = normalizeSpecifier(path)
  const callerDir = isRelativeSpecifier(spec) ? getCallerDirectory() : null

  const fsMatch = await resolveFromFileSystem(spec, callerDir)
  return fsMatch ?? null
}

export async function resolveImagePath(path: ImagePath) {
  if (path == null) return null
  if (path instanceof Promise) return resolvePromiseImagePath(path)
  // oxlint-disable-next-line anti-slop/no-runtime-typeof
  if (typeof path === 'string') return resolveStringImagePath(path)
  return resolveObjectImagePath(path)
}

export async function resolveLqipImageSource(path: ImagePath): Promise<ResolvedImageSource | null> {
  const resolved = await resolveImagePath(path)

  if (!resolved) return null

  // oxlint-disable-next-line anti-slop/no-runtime-typeof
  if (typeof resolved === 'string') {
    return {
      kind: 'remote',
      astroSrc: resolved,
      lqipInput: { src: resolved }
    }
  }

  return {
    kind: 'local',
    astroSrc: resolved,
    lqipInput: resolved
  }
}
