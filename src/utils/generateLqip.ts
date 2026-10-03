import { readFile } from 'node:fs/promises'

import type { GetSVGReturn, LqipType } from '../types/index.ts'

import { getPreviewly } from 'previewly'

import { PREFIX } from '../constants/index.ts'

const FILENAME_REGEX = /^\/[A-Za-z]:\//

function normalizeFsPath(path: string) {
  if (process.platform === 'win32' && FILENAME_REGEX.test(path)) return path.slice(1)
  return path
}

function isNode() {
  return typeof process !== 'undefined' && !!process.versions?.node
}

async function readIfExists(path: string): Promise<Buffer | undefined> {
  if (!isNode()) return undefined

  try {
    return await readFile(path)
  } catch {
    return undefined
  }
}

function normalizeLqipSize(size: number, fallback = 4) {
  const numeric = Number(size)
  if (!Number.isFinite(numeric)) return fallback
  return Math.min(64, Math.max(4, Math.round(numeric)))
}

export async function generateLqip(imagePath: string, lqipType: LqipType, lqipSize: number, isDevelopment: boolean | undefined) {
  try {
    const normalizedPath = normalizeFsPath(imagePath)
    const normalizedSize = normalizeLqipSize(lqipSize)

    const buffer = await readIfExists(normalizedPath)
    if (!buffer) {
      console.warn(`${PREFIX} image not found for:`, imagePath)
      return undefined
    }

    const previewlyResult = await getPreviewly(buffer, { size: normalizedSize })
    let lqipValue: string | GetSVGReturn | undefined

    switch (lqipType) {
      case 'color':
        lqipValue = previewlyResult.color?.hex
        break
      case 'css':
        lqipValue = previewlyResult.css.backgroundImage
        break
      case 'svg':
        lqipValue = previewlyResult.svg
        break
      case 'base64':
      default:
        lqipValue = previewlyResult.base64
        break
    }

    if (isDevelopment) {
      console.info(`${PREFIX} LQIP (${lqipType}) successfully generated!`)
    } else {
      console.info(`${PREFIX} LQIP (${lqipType}) successfully generated for:`, imagePath)
    }

    return lqipValue
  } catch(error) {
    console.error(`${PREFIX} Error generating LQIP (${lqipType}) in:`, imagePath, '\n', error)
    return undefined
  }
}
