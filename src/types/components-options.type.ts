import type { LqipType } from './lqip.type'
import type { StyleMap } from './style.type'

export type ComponentsOptions = {
  src: string | object
  lqip: LqipType
  lqipSize: number
  styleProps: StyleMap
  forbiddenVars: string[]
  isDevelopment: boolean | undefined
}
