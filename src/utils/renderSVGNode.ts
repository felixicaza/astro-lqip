import type { SVGNode } from '../types'

import { styleToString } from './styleToString'

export function renderSVGNode([tag, attrs, children = []]: SVGNode): string {
  let attrString = ''

  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'style' && v && typeof v === 'object') {
      attrString += ` style="${styleToString(v)}"`
    } else if (v !== undefined) {
      attrString += ` ${k}="${v}"`
    }
  }

  if (children.length > 0) {
    return `<${tag}${attrString}>${children.map(renderSVGNode).join('')}</${tag}>`
  } else {
    return `<${tag}${attrString} />`
  }
}
