import type { ComponentsOptions, ImagePath, SVGNode } from '../types'

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
  isDevelopment,
  isPrerendered
}: ComponentsOptions) {
  // resolve any kind of src (string, alias, import result, dynamic import)
  const resolved = await resolveImagePath(src as unknown as ImagePath)
  // resolved may be an object (module-like), { src: '...' } or null
  const resolvedSrc = resolved ?? null

  let lqipImage
  if (resolvedSrc) {
    const lqipInput = typeof resolvedSrc === 'string' ? { src: resolvedSrc } : resolvedSrc
    lqipImage = await getLqip(lqipInput, lqip, lqipSize, isDevelopment, isPrerendered)
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

  return { lqipImage, svgHTML, lqipStyle, combinedStyle, resolvedSrc }
}
