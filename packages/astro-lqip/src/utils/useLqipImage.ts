import type { ComponentsOptions, GetSVGReturn, SVGNode } from '../types/index.ts'

import { PREFIX } from '../constants/index.ts'

import { resolveLqipImageSource } from './resolveImagePath.ts'
import { renderSVGNode } from './renderSvgNode.ts'
import { getLqipStyle } from './getLqipStyle.ts'
import { getLqip } from './getLqip.ts'

export async function useLqipImage({
  src,
  lqip = 'base64',
  lqipSize = 4,
  styleProps = {},
  forbiddenVars = ['--lqip-background', '--z-index', '--opacity'],
  isDevelopment
}: ComponentsOptions) {
  // resolve any kind of src (string, alias, import result, dynamic import)
  const resolvedSource = await resolveLqipImageSource(src)
  // resolved may be an object (module-like), { src: '...' } or null
  const resolvedSrc = resolvedSource?.astroSrc ?? null

  if (lqip === false) {
    return { lqipImage: undefined, svgHTML: '', lqipStyle: {}, combinedStyle: { ...styleProps }, resolvedSrc }
  }

  let lqipImage: string | GetSVGReturn | undefined
  if (resolvedSource) {
    switch (resolvedSource.kind) {
      case 'remote':
      case 'local':
        lqipImage = await getLqip(resolvedSource.lqipInput, lqip, lqipSize, isDevelopment)
        break
    }
  }

  let svgHTML = ''
  if (lqip === 'svg' && Array.isArray(lqipImage)) {
  // SAFETY: getLqip generates GetSVGReturn when lqip is 'svg'
    svgHTML = renderSVGNode(lqipImage as GetSVGReturn)
  }

  const lqipStyle = getLqipStyle(lqip, lqipImage, svgHTML)

  for (const key of Object.keys(styleProps)) {
    if (forbiddenVars.includes(key)) {
      console.warn(`${PREFIX} The CSS variable “${key}” should not be passed in style because it can override the LQIP functionality.`)
    }
  }

  const combinedStyle = {
    ...styleProps,
    ...lqipStyle
  }

  return { lqipImage, svgHTML, lqipStyle, combinedStyle, resolvedSrc }
}
