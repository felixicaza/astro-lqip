export * from './types/index.ts'

import { Background as BackgroundRuntime, type BackgroundProps } from './components/Background.ts'
import { Image as ImageRuntime, type ImageProps } from './components/Image.ts'
import { Picture as PictureRuntime, type PictureProps } from './components/Picture.ts'

type AstroTypedComponent<Props> = ((props: Props) => unknown) & {
  isAstroComponentFactory?: boolean
  moduleId?: string
}

/**
 * Astro component that renders a wrapper element with an optimized background image.
 *
 * @remarks
 * The component resolves the configured source, generates LQIP styles, and applies
 * them inline as a CSS background. Child content is rendered via the default slot.
 */
export const Background = BackgroundRuntime as AstroTypedComponent<BackgroundProps>
/**
 * Astro component that extends astro:assets Image with LQIP behavior.
 *
 * @remarks
 * When lqip is enabled, the component renders a wrapper with placeholder
 * styles and fades the placeholder out on image load.
 * When lqip is false, it delegates to Astro Image rendering directly.
 */
export const Image = ImageRuntime as AstroTypedComponent<ImageProps>
/**
 * Astro component that extends `astro:assets` Picture with LQIP behavior.
 *
 * @remarks
 * When `lqip` is enabled, this component applies placeholder styles to
 * `pictureAttributes` and fades them out once the image loads.
 * When `lqip` is `false`, it delegates to Astro's Picture renderer.
 */
export const Picture = PictureRuntime as AstroTypedComponent<PictureProps>
