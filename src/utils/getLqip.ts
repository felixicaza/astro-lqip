import { join } from 'node:path'
import { mkdir, writeFile, unlink } from 'node:fs/promises'
import { existsSync } from 'node:fs'

import type { LqipType } from '../types'

import { generateLqip } from './generateLqip'

function isRemoteUrl(url: string) {
  return /^https?:\/\//.test(url)
}

const CACHE_DIR = join(process.cwd(), 'node_modules', '.cache', 'astro-lqip')

async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    await mkdir(CACHE_DIR, { recursive: true })
  }
}

export async function getLqip(
  imagePath: { src: string },
  lqipType: LqipType,
  lqipSize: number,
  isDevelopment: boolean | undefined,
  isPrerendered: boolean | undefined
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
      const lqip = await generateLqip(tempPath, lqipType, lqipSize, isDevelopment)
      return lqip
    } finally {
      await unlink(tempPath)
    }
  }

  if (isDevelopment && imagePath.src.startsWith('/@fs/')) {
    const filePath = imagePath.src.replace(/^\/@fs/, '').split('?')[0]
    return await generateLqip(filePath, lqipType, lqipSize, isDevelopment)
  }

  if (!isPrerendered && !isDevelopment) {
    const filePath = join(process.cwd(), 'dist', 'client', imagePath.src)
    return await generateLqip(filePath, lqipType, lqipSize, isDevelopment)
  }

  if (!isDevelopment && imagePath.src.startsWith('/_astro/')) {
    const buildPath = join(process.cwd(), 'dist', imagePath.src)
    return await generateLqip(buildPath, lqipType, lqipSize, isDevelopment)
  }

  return undefined
}
