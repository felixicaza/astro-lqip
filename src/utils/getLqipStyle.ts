import type { GetSVGReturn, LqipType } from '../types'

export function getLqipStyle(lqipType: LqipType, lqipImage: string | GetSVGReturn | undefined, svgHTML: string = '') {
  if (!lqipImage) return {}

  switch (lqipType) {
    case 'css':
      return { '--lqip-background': lqipImage }
    case 'svg':
      return { '--lqip-background': `url('data:image/svg+xml;utf8,${encodeURIComponent(svgHTML)}')` }
    case 'color':
      return { '--lqip-background': lqipImage }
    case 'base64':
    default:
      return { '--lqip-background': `url('${lqipImage}')` }
  }
}
