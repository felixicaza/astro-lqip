/**
 * This file defines the types for the ImageTransform, which is used to optimize images for the Background component.
 * Extracted from Astro's Types, reference: https://github.com/withastro/astro/blob/2dcd8d54c6fb00183228d757bf684e67c79029d8/packages/astro/src/assets/types.ts#L82
 */

type ValidOutputFormats = ['avif', 'png', 'webp', 'jpeg', 'jpg', 'svg']
type ImageQualityPreset = 'low' | 'mid' | 'high' | 'max' | (string & {})
type ImageQuality = ImageQualityPreset | number
type ImageOutputFormat = ValidOutputFormats[number] | (string & {})
type ImageFit = 'fill' | 'contain' | 'cover' | 'none' | 'scale-down' | (string & {})

export interface ImageTransform {
  /**
   * Path of the image that will be used as the background.
   * It can be a relative path, an absolute path, an alias or ImageMetadata.
   */
  src: string | ImageMetadata
  /**
   * CSS custom property that will receive the generated background.
   * (defaults to --background)
   */
  cssVariable?: string
  /**
   * Specifies one or more output formats (first entry is preferred fallback).
   * Accepts a single `ImageOutputFormat` or an ordered array.
   * (defaults to webp)
   */
  format?: ImageOutputFormat | ImageOutputFormat[] | undefined
  /**
   * Explicit widths used for responsive variants.
   */
  widths?: number[] | undefined
  /**
   * Single width fallback when `widths` is omitted.
   */
  width?: number | undefined
  /**
   * Target height for generated assets.
   */
  height?: number | undefined
  /**
   * Compression quality preset or numeric percentage.
   */
  quality?: ImageQuality | undefined
  /**
   * Object-fit behavior applied during resizing.
   */
  fit?: ImageFit | undefined
}
