/**
 * This file defines the types for the ImageTransform, which is used to optimize images for the Background component.
 * Extracted from Astro's Types, reference: https://github.com/withastro/astro/blob/2dcd8d54c6fb00183228d757bf684e67c79029d8/packages/astro/src/assets/types.ts#L82
 */

import type { ImageMetadata } from 'astro'

type ValidOutputFormats = ['avif', 'png', 'webp', 'jpeg', 'jpg', 'svg']
type ImageQualityPreset = 'low' | 'mid' | 'high' | 'max' | (string & {})
type ImageQuality = ImageQualityPreset | number
type ImageOutputFormat = ValidOutputFormats[number] | (string & {})
type ImageFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down' | (string & {})

export interface ImageTransform {
  /**
   * Source image used to generate the background asset.
   * @remarks
   * Accepts a relative path, absolute path, alias, or Astro `ImageMetadata`.
   */
  src: string | ImageMetadata

  /**
   * CSS custom property that receives the generated background value.
   * @defaultValue '--background'
   */
  cssVariable?: string

  /**
   * Placeholder strategy used while the final background asset is loading.
   * @remarks
   * Only `'base64'` and `'color'` are supported because they can be represented
   * as CSS-friendly values for background rendering.
   * @defaultValue 'base64'
   */
  lqip?: 'base64' | 'color' | false

  /**
   * Output format or ordered list of formats for generated assets.
   * @remarks
   * When an array is provided, the first entry is treated as the preferred
   * fallback format.
   * @defaultValue 'webp'
   */
  format?: ImageOutputFormat | ImageOutputFormat[] | undefined

  /**
   * Explicit widths used to generate responsive variants.
   */
  widths?: number[] | undefined

  /**
   * Target width for generated assets.
   * @remarks
   * Omitted when `widths` is provided.
   */
  width?: number | undefined

  /**
   * Target height for generated assets.
   * @remarks
   * Omitted when `widths` is provided, as height is determined by the aspect ratio of the source image.
   */
  height?: number | undefined

  /**
   * Compression quality applied to generated assets.
   * @remarks
   * Accepts either a named quality preset or a numeric percentage.
   */
  quality?: ImageQuality | undefined

  /**
   * Object-fit behavior applied during image resizing.
   */
  fit?: ImageFit | undefined
}
