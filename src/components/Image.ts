import type { SSRResult } from 'astro'
import type { HTMLAttributes } from 'astro/types'
import type { LocalImageProps, RemoteImageProps } from 'astro:assets'
import type { Props as LqipProps, StyleMap } from '../types'

import { createComponent, renderComponent, renderTemplate, spreadAttributes } from 'astro/runtime/server/index.js'
import { Image as AstroImage } from 'astro:assets'

import { useLqipImage } from '../utils/useLqipImage'
import { styleToString } from '../utils/styleToString'

import '../styles/lqip.css'

type Props = (LocalImageProps | RemoteImageProps) & LqipProps & {
  parentAttributes?: HTMLAttributes<'div'>
}

export const Image = createComponent({
  factory: async (result: SSRResult, rawProps: Props) => {
    const { class: className, lqip = 'base64', lqipSize = 4, parentAttributes = {}, ...props } = rawProps

    const { combinedStyle, resolvedSrc } = await useLqipImage({
      src: props.src,
      lqip,
      lqipSize,
      styleProps: (parentAttributes.style ?? {}) as StyleMap,
      forbiddenVars: [],
      isDevelopment: import.meta.env.MODE === 'development'
    })

    const wrapperAttributes = {
      ...parentAttributes,
      class: [parentAttributes.class, className].filter(Boolean).join(' ') || undefined,
      'data-astro-lqip': '',
      style: styleToString(combinedStyle)
    }

    return renderTemplate`
      <div ${spreadAttributes(wrapperAttributes)}>
        ${renderComponent(result, 'Image', AstroImage,
          {
            ...props,
            class: className,
            src: resolvedSrc ?? props.src,
            onload: `
              parentElement.style.setProperty("--z-index", 1);
              parentElement.style.setProperty("--opacity", 0);
            `
          }
        )}
      </div>
    `
  }
})
