import type { StyleInput } from './style.type.ts'

type SVGNodeAttrs = {
  style?: StyleAttrs
} & Record<string, string | number>

export type StyleAttrs = StyleInput
export type SVGNode = [string, SVGNodeAttrs, SVGNode[]]
