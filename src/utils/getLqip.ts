import { join } from 'node:path'

import type { LqipType } from '../types'

import { generateLqip } from './generateLqip'

export async function getLqip(imagePath: { src: string } | null, isDevelopment: boolean, lqipType: LqipType, lqipSize: number) {
  if (!imagePath?.src) return undefined

  if (isDevelopment && imagePath.src.startsWith('/@fs/')) {
    const filePath = imagePath.src.replace(/^\/@fs/, '').split('?')[0]
    return await generateLqip(filePath, isDevelopment, lqipType, lqipSize)
  }

  if (!isDevelopment && imagePath.src.startsWith('/_astro/')) {
    const buildPath = join(process.cwd(), 'dist', imagePath.src)
    return await generateLqip(buildPath, isDevelopment, lqipType, lqipSize)
  }

  return undefined
}
