import type { StyleAttrs, StylePrimitive } from '../types/index.ts'

const CAMEL_TO_KEBAB = /[A-Z]/g

function toKebabCase(prop: string): string {
  return prop.replace(CAMEL_TO_KEBAB, (character) => `-${character.toLowerCase()}`)
}

function serializeStyleValue(value: StylePrimitive): string | undefined {
  if (value === null || value === undefined) return undefined
  return String(value)
}

export function styleToString(style?: StyleAttrs): string | undefined {
  if (style == null) return undefined
  // oxlint-disable-next-line anti-slop/no-runtime-typeof
  if (typeof style === 'string') return style

  const parts: string[] = []

  for (const [key, value] of Object.entries(style)) {
    const serializedValue = serializeStyleValue(value)
    if (serializedValue === undefined) continue
    parts.push(`${toKebabCase(key)}:${serializedValue}`)
  }

  return parts.length > 0 ? parts.join(';') : undefined
}
