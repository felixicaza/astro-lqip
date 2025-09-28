import type { ComponentsOptions, SVGNode } from '../types'

import { PREFIX } from '../constants'

import { resolveImagePath } from './resolveImagePath'
import { renderSVGNode } from './renderSVGNode'
import { getLqipStyle } from './getLqipStyle'
import { getLqip } from './getLqip'

export async function useLqipImage({
  src,
  lqip = 'base64',
  lqipSize = 4,
  styleProps = {},
  forbiddenVars = ['--lqip-background', '--z-index', '--opacity'],
  isDevelopment = false
}: ComponentsOptions) {
  let getImagePath: string | { src: string } | null

  if (typeof src === 'string') {
    getImagePath = src
  } else if (typeof src === 'object' && src !== null) {
    getImagePath = await resolveImagePath(src as unknown as string)
  } else {
    getImagePath = null
  }

  let lqipImage
  if (getImagePath) {
    const lqipInput = typeof getImagePath === 'string' ? { src: getImagePath } : getImagePath
    lqipImage = await getLqip(lqipInput, isDevelopment, lqip, lqipSize)
  }

  let svgHTML = ''
  if (lqip === 'svg' && Array.isArray(lqipImage)) {
    svgHTML = renderSVGNode(lqipImage as unknown as SVGNode)
  }

  const lqipStyle = getLqipStyle(lqip, lqipImage, svgHTML)

  for (const key of Object.keys(styleProps)) {
    if (forbiddenVars.includes(key)) {
      console.warn(
        `${PREFIX} The CSS variable “${key}” should not be passed in style because it can override the functionality of LQIP.`
      )
    }
  }

  const combinedStyle = {
    ...styleProps,
    ...lqipStyle
  }

  return { lqipImage, svgHTML, lqipStyle, combinedStyle }
}
