import type { StyleAttrs } from '../types'

const CAMEL_TO_KEBAB = /[A-Z]/g

function toKebabCase(prop: string): string {
  return prop.replace(CAMEL_TO_KEBAB, (character) => `-${character.toLowerCase()}`)
}

export function styleToString(style?: StyleAttrs): string | undefined {
  if (style == null) return undefined
  if (typeof style === 'string') return style

  const parts: string[] = []

  for (const [key, value] of Object.entries(style)) {
    if (value == null) continue
    parts.push(`${toKebabCase(key)}:${value}`)
  }

  return parts.length > 0 ? parts.join(';') : undefined
}
