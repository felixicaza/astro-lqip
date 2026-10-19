import type { SSRResult } from 'astro'
import type { HTMLAttributes } from 'astro/types'
import type { LocalImageProps, RemoteImageProps } from 'astro:assets'
import type { Props as LqipProps } from '../types'

import { createComponent, renderComponent, renderTemplate, spreadAttributes } from 'astro/runtime/server/index.js'
import { Image as AstroImage } from 'astro:assets'

import { useLqipImage } from '../utils/useLqipImage'
import { styleToString } from '../utils/styleToString'

import '../styles/lqip.css'

export type ImageProps = (LocalImageProps | RemoteImageProps) & LqipProps & {
  /**
   * HTML attributes applied to the wrapper div rendered around the image
   * when LQIP is enabled
   */
  parentAttributes?: HTMLAttributes<'div'>
}

export const Image = createComponent({
  // @ts-expect-error using renderComponent when LQIP is disabled, and renderTemplate when LQIP is enabled
  factory: async(result: SSRResult, rawProps: ImageProps) => {
    const { class: className, lqip = 'base64', lqipSize = 4, parentAttributes = {}, ...props } = rawProps

    const imageResult = await useLqipImage({
      src: props.src,
      lqip,
      lqipSize,
      styleProps: parentAttributes.style ?? {},
      forbiddenVars: [],
      isDevelopment: import.meta.env.MODE === 'development'
    })

    const originalDimensions = imageResult.resolvedDimensions
    const width = props.width == null ? undefined : Number(props.width)
    const height = props.height == null ? undefined : Number(props.height)

    const resolvedWidth = width ?? (
      originalDimensions && height != null
        ? Math.round(height * originalDimensions.width / originalDimensions.height)
        : originalDimensions?.width
    )

    const resolvedHeight = height ?? (
      originalDimensions && width != null
        ? Math.round(width * originalDimensions.height / originalDimensions.width)
        : originalDimensions?.height
    )

    const imageProps = {
      ...props,
      class: className,
      src: imageResult.resolvedSrc ?? props.src,
      width: resolvedWidth,
      height: resolvedHeight
    }

    if (lqip === false) {
      return renderComponent(result, 'Image', AstroImage, imageProps)
    }

    const wrapperAttributes = {
      ...parentAttributes,
      class: [parentAttributes.class, className].filter(Boolean).join(' ') || undefined,
      'data-astro-lqip': '',
      style: styleToString(imageResult.combinedStyle)
    }

    return renderTemplate`
      <div ${spreadAttributes(wrapperAttributes)}>
        ${renderComponent(result, 'Image', AstroImage, {
            ...imageProps,
            onload: 'parentElement.style.setProperty("--z-index", 1);parentElement.style.setProperty("--opacity", 0);'
          })}
      </div>
    `
  }
})
