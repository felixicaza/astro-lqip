import type { LqipType } from './lqip.type'

export type ComponentsOptions = {
  src: string | object
  lqip: LqipType
  lqipSize: number
  styleProps: Record<string, string | number | undefined>
  forbiddenVars: string[]
  isDevelopment: boolean | undefined
}
