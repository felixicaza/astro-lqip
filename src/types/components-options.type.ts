import type { LqipType } from './lqip.type'

export type ComponentsOptions = {
  src: string | object
  lqip?: LqipType
  lqipSize?: number
  styleProps?: Record<string, any>
  forbiddenVars?: string[]
  isDevelopment?: boolean
  isPrerendered?: boolean | undefined
}
