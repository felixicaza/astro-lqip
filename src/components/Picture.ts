import type { SSRResult } from 'astro'
import type { ComponentProps } from 'astro/types'
import type { Props as LqipProps, StyleMap } from '../types'

import { createComponent, renderComponent } from 'astro/runtime/server/index.js'
import { Picture as AstroPicture } from 'astro:assets'

import { useLqipImage } from '../utils/useLqipImage'

import '../styles/lqip.css'

type AstroPictureProps = ComponentProps<typeof AstroPicture>
export type Props = AstroPictureProps & LqipProps

export const Picture = createComponent({
  // @ts-expect-error using renderComponent instead of renderTemplate
  factory: async (result: SSRResult, rawProps: Props) => {
    const { class: className, lqip = 'base64', lqipSize = 4, pictureAttributes = {}, ...props } = rawProps

    const { combinedStyle, resolvedSrc } = await useLqipImage({
      src: props.src,
      lqip,
      lqipSize,
      styleProps: (pictureAttributes.style ?? {}) as StyleMap,
      forbiddenVars: [],
      isDevelopment: import.meta.env.MODE === 'development'
    })

    if (lqip === false) {
      return await renderComponent(result, 'Picture', AstroPicture, {
        ...props,
        class: className,
        src: resolvedSrc ?? props.src,
        pictureAttributes
      })
    }

    return await renderComponent(result, 'Picture', AstroPicture,
      {
        ...props,
        class: className,
        src: resolvedSrc ?? props.src,
        pictureAttributes: {
          'data-astro-lqip': '',
          ...pictureAttributes,
          style: combinedStyle
        },
        onload: `
          parentElement.style.setProperty("--z-index", 1);
          parentElement.style.setProperty("--opacity", 0);
        `
      }
    )
  }
})
