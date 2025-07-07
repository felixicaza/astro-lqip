import { readFile } from 'node:fs/promises'

import type { GetSVGReturn, LqipType } from '../types'

import { PREFIX } from '../constants'

import { getPlaiceholder } from 'plaiceholder'

export async function generateLqip(filePath: string, isDevelopment: boolean, lqipType: LqipType, lqipSize: number) {
  try {
    const buffer = await readFile(filePath)
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
      console.log(`${PREFIX} LQIP (${lqipType}) successfully generated for:`, filePath)
    }

    return lqipValue
  } catch (err) {
    console.error(`${PREFIX} Error generating LQIP (${lqipType}) in:`, filePath, '\n', err)
    return undefined
  }
}
