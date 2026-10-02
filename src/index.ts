/**
 * Astro component that renders a wrapper element with an optimized background image.
 *
 * The component resolves the configured source, generates LQIP styles, and applies
 * them inline as a CSS background. Child content is rendered via the default slot.
 */
export { Background } from './components/Background.ts'
/**
 * Astro component that extends astro:assets Image with LQIP behavior.
 *
 * When lqip is enabled, the component renders a wrapper with placeholder
 * styles and fades the placeholder out on image load.
 * When lqip is false, it delegates to Astro Image rendering directly.
 */
export { Image } from './components/Image.ts'
/**
 * Astro component that extends `astro:assets` Picture with LQIP behavior.
 *
 * When `lqip` is enabled, this component applies placeholder styles to
 * `pictureAttributes` and fades them out once the image loads.
 * When `lqip` is `false`, it delegates to Astro's Picture renderer.
 */
export { Picture } from './components/Picture.ts'

export type { BackgroundProps } from './components/Background.ts'
export type { ImageProps } from './components/Image.ts'
export type { PictureProps } from './components/Picture.ts'

export type {
  ComponentsOptions,
  GetSVGReturn,
  GlobMap,
  ImagePath,
  ImageTransform,
  ImportModule,
  LqipType,
  Props,
  ResolvedImage,
  SVGNode,
  StyleAttrs,
  StyleInput,
  StyleMap
} from './types/index.ts'
