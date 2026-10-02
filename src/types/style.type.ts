import type { HTMLAttributes } from 'astro/types'

export type StylePrimitive = string | number | null | undefined
export type StyleMap = Extract<NonNullable<HTMLAttributes<'div'>['style']>, object>
export type StyleInput = StyleMap | string
