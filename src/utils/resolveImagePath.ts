import { existsSync } from 'node:fs'
import { join } from 'node:path'

import type { GlobMap, ImagePath, ImportModule, ResolvedImage } from '../types'

import { PREFIX } from '../constants'

const PUBLIC_DIR = join(process.cwd(), 'public')

const globFilesInSrc: GlobMap = ({ ...import.meta.glob('/src/**/*.{png,jpg,jpeg,svg}') } as unknown) as GlobMap

function warnFiles(filePath: string | undefined) {
  if (!filePath) return

  const lowerPath = filePath.toLowerCase()

  if (lowerPath.includes(`${join('/', 'public')}`) || lowerPath.includes('/public/') || filePath.startsWith(PUBLIC_DIR)) {
    console.warn(
      `${PREFIX} Warning: image resolved from /public. Images should not be placed in /public — move them to /src so Astro can process them correctly.`
    )
  }

  if (lowerPath.endsWith('.webp') || lowerPath.endsWith('.avif')) {
    const extension = lowerPath.endsWith('.webp') ? 'webp' : 'avif'
    console.warn(
      `${PREFIX} Warning: image is in ${extension} format. These formats are usually already optimized; using this component to re-process them may degrade quality.`
    )
  }
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isPromise(v: unknown): v is Promise<unknown> {
  if (!isObject(v)) return false
  const promise = v as { then?: unknown }
  return typeof promise.then === 'function'
}

function hasSrc(v: unknown): v is ResolvedImage {
  return isObject(v) && typeof (v as Record<string, unknown>)['src'] === 'string'
}

function isRemoteUrl(v: string) {
  return /^https?:\/\//.test(v)
}

function findGlobMatch(keys: string[], path: string) {
  const candidates = [path.replace(/^\//, ''), `/${path.replace(/^\//, '')}`]
  const match = keys.find((k) => candidates.includes(k) || k.endsWith(path) || k.endsWith(path.replace(/^\//, '')))
  if (match) return match

  const fileName = path.split('/').pop()
  if (!fileName) return null

  return keys.find((k) => k.endsWith(`/${fileName}`) || k.endsWith(fileName)) ?? null
}

export async function resolveImagePath(path: ImagePath) {
  if (path == null) return null

  // validate dynamic import (Promise-like)
  if (isPromise(path)) {
    const mod = (await (path as Promise<ImportModule>)) as ImportModule
    const resolved = (mod.default ?? mod) as unknown
    if (hasSrc(resolved)) {
      warnFiles(resolved.src)
      return resolved
    }
    if (typeof resolved === 'string') {
      warnFiles(resolved)
      return resolved
    }
    return null
  }

  // validate already-resolved object (import result or { src: ... })
  if (isObject(path)) {
    const obj = path as Record<string, unknown>
    const objSrc = typeof obj['src'] === 'string' ? (obj['src'] as string) : undefined
    warnFiles(objSrc)
    return hasSrc(obj) ? (obj as ResolvedImage) : null
  }

  // validate string path
  if (typeof path === 'string') {
    if (isRemoteUrl(path)) return path

    const keys = Object.keys(globFilesInSrc)
    const matchKey = findGlobMatch(keys, path)

    if (matchKey) {
      try {
        const mod = await globFilesInSrc[matchKey]()
        const resolved = (mod.default ?? mod) as unknown

        if (hasSrc(resolved)) {
          warnFiles((resolved as ResolvedImage).src)
          return resolved as ResolvedImage
        }

        if (typeof resolved === 'string') {
          warnFiles(resolved)
          return resolved
        }
      } catch (err) {
        console.log(`${PREFIX} resolveImagePath: failed to import glob match "${matchKey}" — falling back to filesystem.`, err)
      }
    }

    // If module doesn't expose a usable value, fall through to filesystem check
    try {
      const absCandidate = path.startsWith('/') ? join(process.cwd(), path) : join(process.cwd(), path)

      if (existsSync(absCandidate)) {
        warnFiles(absCandidate)
        return { src: `/@fs${absCandidate}` }
      }
    } catch (err) {
      console.debug(`${PREFIX} resolveImagePath: filesystem check failed for "${path}".`, err)
    }

    return null
  }

  return null
}
