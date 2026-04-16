import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { mkdir, writeFile, readFile, unlink, readdir } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'

import type { LqipType } from '../types'

import { generateLqip } from './generateLqip'

import { PREFIX } from '../constants'

function isRemoteUrl(url: string) {
  return /^https?:\/\//.test(url)
}

const CACHE_DIR = join(process.cwd(), 'node_modules', '.cache', 'astro-lqip')
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'avif']
const SEARCH_ROOT = ['src']
const HASHED_FILENAME_REGEX = /\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9]+$/
const HASHED_FILENAME_CAPTURE_REGEX = /^(.+?)\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9]+$/

const BASE_URL = (() => {
  try {
    const base = (import.meta.env?.BASE_URL ?? '/') as string
    if (!base || base === '/') return '/'
    return base.endsWith('/') ? base.slice(0, -1) : base
  } catch {
    return '/'
  }
})()

const searchCache = new Map<string, string | null>()

function stripBasePath(src: string) {
  if (typeof src !== 'string') return src

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
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true })
  }
}

function getFileMtime(filePath: string): number | undefined {
  try {
    return statSync(filePath).mtimeMs
  } catch {
    return undefined
  }
}

function computeCacheKey(imageSrc: string, lqipType: string, lqipSize: number, mtimeMs?: number): string {
  const input = mtimeMs !== undefined
    ? `${imageSrc}:${lqipType}:${lqipSize}:${mtimeMs}`
    : `${imageSrc}:${lqipType}:${lqipSize}`
  const hash = createHash('sha256').update(input).digest('hex').slice(0, 16)
  return `lqip-${hash}.json`
}

async function readCache(cacheKey: string): Promise<unknown | undefined> {
  const cachePath = join(CACHE_DIR, cacheKey)
  try {
    const data = await readFile(cachePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return undefined
  }
}

async function writeCache(cacheKey: string, value: unknown): Promise<void> {
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

async function recursiveFind(basename: string): Promise<string | undefined> {
  if (!basename) return

  if (searchCache.has(basename)) {
    const cached = searchCache.get(basename)
    return cached || undefined
  }

  const ignoreDirs = new Set(['node_modules', 'dist', '.astro'])

  async function walk(dir: string): Promise<string | undefined> {
    let entries: string[]

    try {
      entries = await readdir(dir)
    } catch {
      return
    }

    for (const entry of entries) {
      const full = join(dir, entry)
      let st: ReturnType<typeof statSync>

      try {
        st = statSync(full)
      } catch {
        continue
      }

      if (st.isDirectory()) {
        if (ignoreDirs.has(entry)) continue
        const found = await walk(full)
        if (found) return found
      } else {
        // match by basename and extension
        if (EXTENSIONS.some((ext) => entry === `${basename}.${ext}`)) {
          return full
        }
      }
    }
  }

  for (const rootRel of SEARCH_ROOT) {
    const rootAbs = join(process.cwd(), rootRel)

    if (existsSync(rootAbs)) {
      const found = await walk(rootAbs)
      if (found) {
        searchCache.set(basename, found)
        return found
      }
    }
  }

  searchCache.set(basename, null)
}

export async function getLqip(
  imagePath: { src: string },
  lqipType: LqipType,
  lqipSize: number,
  isDevelopment: boolean | undefined
) {
  if (!imagePath?.src) return undefined
  if (lqipType === false) return undefined

  // Resolve the actual file path for mtime-based cache invalidation
  let resolvedFilePath: string | undefined

  if (isRemoteUrl(imagePath.src)) {
    // Remote images use URL as cache key (no mtime available)
    resolvedFilePath = undefined
  } else if (isDevelopment && imagePath.src.startsWith('/@fs/')) {
    resolvedFilePath = imagePath.src.replace(/^\/@fs/, '').split('?')[0]
  }

  const mtimeMs = resolvedFilePath ? getFileMtime(resolvedFilePath) : undefined
  const cacheKey = computeCacheKey(imagePath.src, lqipType, lqipSize, mtimeMs)
  const cached = await readCache(cacheKey)
  if (cached !== undefined) return cached

  let result: Awaited<ReturnType<typeof generateLqip>>

  if (isRemoteUrl(imagePath.src)) {
    await ensureCacheDir()

    const response = await fetch(imagePath.src)
    if (!response.ok) return undefined

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const tempPath = join(CACHE_DIR, `temp-${cacheKey.replace('.json', '')}-${Math.random().toString(36).slice(2)}.jpg`)
    await writeFile(tempPath, buffer)

    try {
      result = await generateLqip(tempPath, lqipType, lqipSize, isDevelopment)
    } finally {
      try {
        await unlink(tempPath)
      } catch {
        // temp file may already be removed
      }
    }
  } else if (isDevelopment && imagePath.src.startsWith('/@fs/')) {
    const filePath = imagePath.src.replace(/^\/@fs/, '').split('?')[0]
    result = await generateLqip(filePath, lqipType, lqipSize, isDevelopment)
  } else if (!isDevelopment) {
    const src = imagePath.src
    const normalizedSrc = stripBasePath(src)
    const clean = normalizedSrc.replace(/^\//, '')

    if (clean) {
      const candidatePaths = [
        join(process.cwd(), 'dist', 'client', clean),
        join(process.cwd(), 'dist', clean)
      ]

      for (const path of candidatePaths) {
        if (existsSync(path)) {
          result = await generateLqip(path, lqipType, lqipSize, isDevelopment)
          break
        }
      }
    }

    if (result === undefined) {
      const fileName = normalizedSrc.split('/').pop() ?? ''
      if (HASHED_FILENAME_REGEX.test(fileName)) {
        const originalBase = extractOriginalFileName(normalizedSrc)
        const originalSource = await recursiveFind(originalBase)

        if (originalSource) {
          console.log(`${PREFIX} fallback recursive source found:`, originalSource)
          result = await generateLqip(originalSource, lqipType, lqipSize, isDevelopment)
        } else {
          console.warn(`${PREFIX} original source not found recursively for basename:`, originalBase)
        }
      }
    }
  }

  if (result !== undefined) {
    await writeCache(cacheKey, result)
  }

  return result
}
