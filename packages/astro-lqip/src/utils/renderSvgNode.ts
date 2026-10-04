import type { GetSVGReturn, StyleMap } from '../types/index.ts'

import { styleToString } from './styleToString.ts'

type RootAttributes = GetSVGReturn[1]
type RectAttributes = GetSVGReturn[2][number][1]

function serializeRootAttributes(attrs: RootAttributes): string {
  const { style, ...attributes } = attrs
  const serializedAttributes = Object.entries(attributes)
    .map(([key, value]) => ` ${key}="${String(value)}"`)
    .join('')

  const serializedStyle = styleToString(style)
  return serializedAttributes + (serializedStyle ? ` style="${serializedStyle}"` : '')
}

function serializeRectAttributes(attrs: RectAttributes): string {
  return Object.entries(attrs)
    .map(([key, value]) => ` ${key}="${String(value)}"`)
    .join('')
}

export function renderSVGNode([tag, attrs, rectangles]: GetSVGReturn): string {
  const attrString = serializeRootAttributes(attrs)
  const content = rectangles
    .map(([childTag, childAttrs]) => `<${childTag}${serializeRectAttributes(childAttrs)} />`)
    .join('')

  return `<${tag}${attrString}>${content}</${tag}>`
}
