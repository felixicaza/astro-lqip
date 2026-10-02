import type { SSRResult } from 'astro'
import type { HTMLAttributes } from 'astro/types'
import type { LocalImageProps, RemoteImageProps } from 'astro:assets'
import type { Props as LqipProps } from '../types/index.ts'

import { createComponent, renderComponent } from 'astro/runtime/server/index.js'
import { Picture as AstroPicture } from 'astro:assets'

import { useLqipImage } from '../utils/useLqipImage.ts'
import { resolveImagePath } from '../utils/resolveImagePath.ts'

import '../styles/lqip.css'

export type PictureProps = (LocalImageProps | RemoteImageProps) & LqipProps & {
  pictureAttributes?: HTMLAttributes<'picture'>
}

export const Picture = createComponent({
  // @ts-expect-error using renderComponent instead of renderTemplate
  factory: async(result: SSRResult, rawProps: PictureProps) => {
    const { class: className, lqip = 'base64', lqipSize = 4, pictureAttributes = {}, ...props } = rawProps

    if (lqip === false) {
      const resolvedSrc = await resolveImagePath(props.src)

      return await renderComponent(result, 'Picture', AstroPicture, {
        ...props,
        class: className,
        src: resolvedSrc ?? props.src,
        pictureAttributes
      })
    }

    const { combinedStyle, resolvedSrc } = await useLqipImage({
      src: props.src,
      lqip,
      lqipSize,
      styleProps: pictureAttributes.style ?? {},
      forbiddenVars: [],
      isDevelopment: import.meta.env.MODE === 'development'
    })

    return await renderComponent(result, 'Picture', AstroPicture, {
      ...props,
      class: className,
      src: resolvedSrc ?? props.src,
      pictureAttributes: {
        'data-astro-lqip': '',
        ...pictureAttributes,
        style: combinedStyle
      },
      onload: 'parentElement.style.setProperty("--z-index", 1);parentElement.style.setProperty("--opacity", 0);'
    })
  }
})
