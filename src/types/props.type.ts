import type { LqipType } from './lqip.type'

export type Props = {
  /**
   * Placeholder strategy used to generate the low-quality image preview.
   * @remarks
   * Supported values are `'color'`, `'css'`, `'svg'`, `'base64'`, or `false`.
   * @defaultValue 'base64'
   */
  lqip?: LqipType

  /**
   * Pixel size used to generate the low-quality image preview.
   * @remarks
   * Expected to be between `4` and `64`.
   * @defaultValue 4
   */
  lqipSize?: number
}
