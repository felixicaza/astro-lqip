import type { GetSVGReturn, LqipType } from '../types/index.ts'

import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { access, mkdir, writeFile, readFile, unlink, readdir, stat } from 'node:fs/promises'

import { generateLqip } from './generateLqip.ts'

import { PREFIX } from '../constants/index.ts'

type LqipResult = Awaited<ReturnType<typeof generateLqip>>
type FileStat = Awaited<ReturnType<typeof stat>>

const IS_REMOTE_URL_REGEX = /^https?:\/\//
const DEV_FS_PREFIX_REGEX = /^\/@fs/
const SLASH_REGEX = /^\//

const CACHE_DIR = join(process.cwd(), 'node_modules', '.cache', 'astro-lqip')
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif']
const SEARCH_ROOT = ['src']
const HASHED_FILENAME_REGEX = /\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9]+$/
const HASHED_FILENAME_CAPTURE_REGEX = /^(.+?)\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9]+$/

const BASE_URL = (() => {
  try {
    const base = (import.meta.env?.BASE_URL ?? '/')
    if (!base || base === '/') return '/'
    return base.endsWith('/') ? base.slice(0, -1) : base
  } catch {
    return '/'
  }
})()

const searchCache = new Map<string, string | null>()

function isRemoteUrl(url: string) {
  return IS_REMOTE_URL_REGEX.test(url)
}

function getDevelopmentFilePath(imageSrc: string) {
  const queryIndex = imageSrc.indexOf('?')
  const pathWithPrefix = queryIndex === -1
    ? imageSrc
    : imageSrc.slice(0, queryIndex)

  return pathWithPrefix.replace(DEV_FS_PREFIX_REGEX, '')
}

function stripBasePath(src: string) {
  const queryIndex = src.indexOf('?')
  let pathOnly = queryIndex >= 0 ? src.slice(0, queryIndex) : src

  if (BASE_URL !== '/' && pathOnly.startsWith(BASE_URL)) {
    pathOnly = pathOnly.slice(BASE_URL.length) || '/'
  }

  if (!pathOnly.startsWith('/')) {
    pathOnly = `/${pathOnly}`
  }

  return pathOnly
}

async function ensureCacheDir() {
  await mkdir(CACHE_DIR, { recursive: true })
}

async function getFileMtime(filePath: string): Promise<number | undefined> {
  try {
    return (await stat(filePath)).mtimeMs
  } catch {
    return undefined
  }
}

function computeCacheKey(imageSrc: string, lqipType: string, lqipSize: number, mtimeMs?: number): string {
  const input = mtimeMs !== undefined ? `${imageSrc}:${lqipType}:${lqipSize}:${mtimeMs}` : `${imageSrc}:${lqipType}:${lqipSize}`
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 16)
  return `lqip-${hash}.json`
}

async function readCache(cacheKey: string): Promise<LqipResult> {
  const cachePath = join(CACHE_DIR, cacheKey)
  try {
    const data = await readFile(cachePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return undefined
  }
}

async function writeCache(cacheKey: string, value: LqipResult): Promise<void> {
  await ensureCacheDir()
  const cachePath = join(CACHE_DIR, cacheKey)
  await writeFile(cachePath, JSON.stringify(value))
}

function extractOriginalFileName(filename: string) {
  const file = filename.split('/').pop() || ''

  const match = file.match(HASHED_FILENAME_CAPTURE_REGEX)
  if (match) return match[1]

  const parts = file.split('.')
  if (parts.length >= 3) return parts.slice(0, parts.length - 2).join('.')

  return parts[0]
}

async function readDirectoryEntries(dir: string): Promise<string[]> {
  try {
    return await readdir(dir)
  } catch {
    return []
  }
}

async function getEntryStat(path: string): Promise<FileStat | undefined> {
  try {
    return await stat(path)
  } catch {
    return undefined
  }
}

function isMatchingImage(entry: string, basename: string): boolean {
  return EXTENSIONS.some((extension) => entry === `${basename}.${extension}`)
}

async function findEntry(
  dir: string,
  entry: string,
  basename: string,
  ignoredDirectories: Set<string>
): Promise<string | undefined> {
  const fullPath = join(dir, entry)
  const entryStat = await getEntryStat(fullPath)

  if (!entryStat) return undefined

  if (entryStat.isDirectory()) {
    if (ignoredDirectories.has(entry)) return undefined

    return walkDirectory(fullPath, basename, ignoredDirectories)
  }

  if (isMatchingImage(entry, basename)) return fullPath

  return undefined
}

async function walkDirectory(dir: string, basename: string, ignoredDirectories: Set<string>): Promise<string | undefined> {
  const entries = await readDirectoryEntries(dir)

  async function find(index: number): Promise<string | undefined> {
    if (index >= entries.length) return undefined

    const foundPath = await findEntry(dir, entries[index], basename, ignoredDirectories)
    if (foundPath) return foundPath

    return find(index + 1)
  }

  return find(0)
}

async function recursiveFind(basename: string): Promise<string | undefined> {
  if (!basename) return undefined
  if (searchCache.has(basename)) return searchCache.get(basename) || undefined

  const ignoredDirectories = new Set(['node_modules', 'dist', '.astro'])

  const search = async(index: number): Promise<string | undefined> => {
    if (index >= SEARCH_ROOT.length) return undefined

    const rootRel = SEARCH_ROOT[index]
    const rootAbs = join(process.cwd(), rootRel)

    const foundPath = await walkDirectory(rootAbs, basename, ignoredDirectories)
    if (foundPath) return foundPath

    return search(index + 1)
  }

  const foundPath = await search(0)

  searchCache.set(basename, foundPath ?? null)
  return foundPath
}

function getResolvedFilePath(imageSrc: string, isDevelopment: boolean | undefined) {
  if (isRemoteUrl(imageSrc)) return undefined
  if (isDevelopment && imageSrc.startsWith('/@fs/')) return getDevelopmentFilePath(imageSrc)
  return undefined
}

async function generateRemoteLqip(
  imageSrc: string,
  lqipType: LqipType,
  lqipSize: number,
  isDevelopment: boolean | undefined,
  cacheKey: string
): Promise<LqipResult> {
  await ensureCacheDir()

  const response = await fetch(imageSrc)
  if (!response.ok) return undefined

  const buffer = Buffer.from(await response.arrayBuffer())
  const tempPath = join(CACHE_DIR, `temp-${cacheKey.replace('.json', '')}-${Math.random().toString(36).slice(2)}.jpg`)

  await writeFile(tempPath, buffer)

  try {
    return await generateLqip(tempPath, lqipType, lqipSize, isDevelopment)
  } finally {
    try {
      await unlink(tempPath)
    } catch {
      // The temporary file may already have been removed
    }
  }
}

async function findExistingPath(paths: string[]): Promise<string | undefined> {
  async function find(index: number): Promise<string | undefined> {
    if (index >= paths.length) return undefined

    try {
      await access(paths[index])
      return paths[index]
    } catch {
      // Continue checking the next path
      return find(index + 1)
    }
  }

  return find(0)
}

async function generateProductionLqip(
  imageSrc: string,
  lqipType: LqipType,
  lqipSize: number,
  isDevelopment: boolean | undefined
): Promise<LqipResult> {
  const normalizedSrc = stripBasePath(imageSrc)
  const clean = normalizedSrc.replace(SLASH_REGEX, '')

  if (clean) {
    const candidatePaths = [
      join(process.cwd(), 'dist', 'client', clean),
      join(process.cwd(), 'dist', clean)
    ]

    const existingPath = await findExistingPath(candidatePaths)
    if (existingPath) return generateLqip(existingPath, lqipType, lqipSize, isDevelopment)
  }

  const fileName = normalizedSrc.split('/').pop() ?? ''

  if (!HASHED_FILENAME_REGEX.test(fileName)) return undefined

  const originalBase = extractOriginalFileName(normalizedSrc)
  const originalSource = await recursiveFind(originalBase)

  if (!originalSource) {
    console.warn(`${PREFIX} original source not found recursively for basename:`, originalBase)
    return undefined
  }

  console.info(`${PREFIX} fallback recursive source found:`, originalSource)

  return generateLqip(originalSource, lqipType, lqipSize, isDevelopment)
}

async function generateFromSource(
  imageSrc: string,
  lqipType: LqipType,
  lqipSize: number,
  isDevelopment: boolean | undefined,
  cacheKey: string
): Promise<LqipResult> {
  if (isRemoteUrl(imageSrc)) return generateRemoteLqip(imageSrc, lqipType, lqipSize, isDevelopment, cacheKey)

  if (isDevelopment && imageSrc.startsWith('/@fs/')) {
    return generateLqip(getDevelopmentFilePath(imageSrc), lqipType, lqipSize, isDevelopment)
  }
  if (!isDevelopment) return generateProductionLqip(imageSrc, lqipType, lqipSize, isDevelopment)
  return undefined
}

export async function getLqip(
  imagePath: { src: string },
  lqipType: LqipType,
  lqipSize: number,
  isDevelopment: boolean | undefined
): Promise<string | GetSVGReturn | undefined> {
  if (!imagePath?.src) return undefined
  if (lqipType === false) return undefined

  const resolvedFilePath = getResolvedFilePath(imagePath.src, isDevelopment)
  const mtimeMs = resolvedFilePath ? await getFileMtime(resolvedFilePath) : undefined
  const cacheKey = computeCacheKey(imagePath.src, lqipType, lqipSize, mtimeMs)

  const cached = await readCache(cacheKey)
  if (cached !== undefined) return cached

  const result = await generateFromSource(imagePath.src, lqipType, lqipSize, isDevelopment, cacheKey)
  if (result !== undefined) await writeCache(cacheKey, result)
  return result
}
