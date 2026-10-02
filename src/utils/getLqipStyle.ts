import type { GetSVGReturn, LqipType } from '../types/index.ts'

function getLqipString(value: string | GetSVGReturn | undefined): string | undefined {
  if (value === undefined || Array.isArray(value)) return undefined
  return value
}

export function getLqipStyle(lqipType: LqipType, lqipImage: string | GetSVGReturn | undefined, svgHTML: string = '') {
  if (!lqipImage) return {}

  switch (lqipType) {
    case 'css':
    case 'color': {
      const value = getLqipString(lqipImage)
      if (value === undefined) return {}
      return { '--lqip-background': value }
    }

    case 'svg':
      return {
        '--lqip-background': `url('data:image/svg+xml;utf8,${encodeURIComponent(svgHTML)}')`
      }

    case 'base64':
    default: {
      const value = getLqipString(lqipImage)
      if (value === undefined) return {}
      return { '--lqip-background': `url('${value}')` }
    }
  }
}
