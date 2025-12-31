import { join } from 'node:path'
import { mkdir, writeFile, unlink, readdir } from 'node:fs/promises'
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

  if (isRemoteUrl(imagePath.src)) {
    await ensureCacheDir()

    const response = await fetch(imagePath.src)
    if (!response.ok) return undefined

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const tempPath = join(CACHE_DIR, `astro-lqip-${Math.random().toString(36).slice(2)}.jpg`)
    await writeFile(tempPath, buffer)

    try {
      return await generateLqip(tempPath, lqipType, lqipSize, isDevelopment)
    } finally {
      await unlink(tempPath)
    }
  }

  if (isDevelopment && imagePath.src.startsWith('/@fs/')) {
    const filePath = imagePath.src.replace(/^\/@fs/, '').split('?')[0]
    return await generateLqip(filePath, lqipType, lqipSize, isDevelopment)
  }

  if (!isDevelopment) {
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
          return await generateLqip(path, lqipType, lqipSize, isDevelopment)
        }
      }
    }

    const fileName = normalizedSrc.split('/').pop() ?? ''
    if (HASHED_FILENAME_REGEX.test(fileName)) {
      const originalBase = extractOriginalFileName(normalizedSrc)
      const originalSource = await recursiveFind(originalBase)

      if (originalSource) {
        console.log(`${PREFIX} fallback recursive source found:`, originalSource)
        return await generateLqip(originalSource, lqipType, lqipSize, isDevelopment)
      } else {
        console.warn(`${PREFIX} original source not found recursively for basename:`, originalBase)
      }
    }
  }

  return undefined
}
