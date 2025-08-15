import type { LqipType } from './lqip.type'

export type Props = {
  /**
   * LQIP type.
   * This can be 'color', 'css', 'svg' or 'base64'.
   * The default value is 'base64'.
   */
  lqip?: LqipType
  /**
   * Size of the LQIP image in pixels.
   * This value should be between 4 and 64.
   * The default value is 4.
   */
  lqipSize?: number
}
