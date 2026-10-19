import type { SSRResult } from 'astro'
import type { HTMLAttributes } from 'astro/types'
import type { LocalImageProps, RemoteImageProps } from 'astro:assets'
import type { Props as LqipProps } from '../types/index.ts'

import { createComponent, renderComponent } from 'astro/runtime/server/index.js'
import { Picture as AstroPicture } from 'astro:assets'

import { useLqipImage } from '../utils/useLqipImage.ts'

import '../styles/lqip.css'

export type PictureProps = (LocalImageProps | RemoteImageProps) & LqipProps & {
  pictureAttributes?: HTMLAttributes<'picture'>
}

export const Picture = createComponent({
  // @ts-expect-error using renderComponent instead of renderTemplate
  factory: async(result: SSRResult, rawProps: PictureProps) => {
    const { class: className, lqip = 'base64', lqipSize = 4, pictureAttributes = {}, ...props } = rawProps

    const imageResult = await useLqipImage({
      src: props.src,
      lqip,
      lqipSize,
      styleProps: pictureAttributes.style ?? {},
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

    const pictureProps = {
      ...props,
      class: className,
      src: imageResult.resolvedSrc ?? props.src,
      width: resolvedWidth,
      height: resolvedHeight
    }

    if (lqip === false) {
      return renderComponent(result, 'Picture', AstroPicture, { ...pictureProps, pictureAttributes })
    }

    return await renderComponent(result, 'Picture', AstroPicture, {
      ...pictureProps,
      pictureAttributes: {
        'data-astro-lqip': '',
        ...pictureAttributes,
        style: imageResult.combinedStyle
      },
      onload: 'parentElement.style.setProperty("--z-index", 1);parentElement.style.setProperty("--opacity", 0);'
    })
  }
})
