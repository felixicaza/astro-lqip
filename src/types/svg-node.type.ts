export type StyleAttrs = Record<string, string | number>

type SVGNodeAttrs = {
  style?: StyleAttrs
} & Record<string, string | number>

export type SVGNode = [string, SVGNodeAttrs, SVGNode[]]
