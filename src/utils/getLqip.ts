import { join } from 'node:path'

import type { ImageMetadata } from 'astro'
import type { LqipType } from '../types'

import { generateLqip } from './generateLqip'

export async function getLqip(imageMetadata: ImageMetadata, envMode: boolean, lqipType: LqipType, lqipSize: number) {
  if (!imageMetadata?.src) return undefined

  if (envMode && imageMetadata.src.startsWith('/@fs/')) {
    const filePath = imageMetadata.src.replace(/^\/@fs/, '').split('?')[0]
    return await generateLqip(filePath, envMode, lqipType, lqipSize)
  }

  if (!envMode && imageMetadata.src.startsWith('/_astro/')) {
    const buildPath = join(process.cwd(), 'dist', imageMetadata.src)
    return await generateLqip(buildPath, envMode, lqipType, lqipSize)
  }
}
