import type { LqipType } from './lqip.type.ts'

export interface Props {
  /**
   * Placeholder strategy used to generate the low-quality image preview.
   * Supported values are `'color'`, `'css'`, `'svg'`, `'base64'`, or `false`.
   * @default 'base64'
   */
  lqip?: LqipType

  /**
   * Pixel size used to generate the low-quality image preview.
   * Expected to be between `4` and `64`.
   * @default 4
   */
  lqipSize?: number
}
