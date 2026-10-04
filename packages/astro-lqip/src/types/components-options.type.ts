import type { LqipType } from './lqip.type.ts'
import type { StyleMap } from './style.type.ts'
import type { ImagePath } from './image-path.type.ts'

export interface ComponentsOptions {
  src: ImagePath
  lqip?: LqipType
  lqipSize?: number
  styleProps?: StyleMap
  forbiddenVars?: string[]
  isDevelopment: boolean | undefined
}
