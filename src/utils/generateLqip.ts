import { readFile } from 'node:fs/promises'

import type { GetSVGReturn, LqipType } from '../types'

import { PREFIX } from '../constants'

import { getPlaiceholder } from 'plaiceholder'

function normalizeFsPath(path: string) {
  if (process.platform === 'win32' && /^\/[A-Za-z]:\//.test(path)) {
    return path.slice(1)
  }
  return path
}

export async function generateLqip(
  imagePath: string,
  lqipType: LqipType,
  lqipSize: number,
  isDevelopment: boolean | undefined
) {
  try {
    const normalizedPath = normalizeFsPath(imagePath)
    const buffer = await readFile(normalizedPath)
    const plaiceholderResult = await getPlaiceholder(buffer, { size: lqipSize })
    let lqipValue: string | GetSVGReturn | undefined

    switch (lqipType) {
      case 'color':
        lqipValue = plaiceholderResult.color?.hex
        break
      case 'css':
        lqipValue = typeof plaiceholderResult.css === 'object' && plaiceholderResult.css.backgroundImage
          ? plaiceholderResult.css.backgroundImage
          : String(plaiceholderResult.css)
        break
      case 'svg':
        lqipValue = plaiceholderResult.svg
        break
      case 'base64':
      default:
        lqipValue = plaiceholderResult.base64
        break
    }

    if (isDevelopment) {
      console.log(`${PREFIX} LQIP (${lqipType}) successfully generated!`)
    } else {
      console.log(`${PREFIX} LQIP (${lqipType}) successfully generated for:`, imagePath)
    }

    return lqipValue
  } catch (err) {
    console.error(`${PREFIX} Error generating LQIP (${lqipType}) in:`, imagePath, '\n', err)
    return undefined
  }
}
