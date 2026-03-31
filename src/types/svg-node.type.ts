import type { GetSVGReturn } from './plaiceholder.type'
import type { StyleInput } from './style.type'

export type StyleAttrs = StyleInput<GetSVGReturn>

type SVGNodeAttrs = {
  style?: StyleAttrs
} & Record<string, string | number>

export type SVGNode = [string, SVGNodeAttrs, SVGNode[]]
