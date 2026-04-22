import type { SSRResult } from 'astro'
import type { ComponentSlots } from 'astro/runtime/server/index.js'
import type { ImageTransform } from '../types'

import { createComponent, renderSlotToString, spreadAttributes, renderTemplate } from 'astro/runtime/server/index.js'

import { useLqipBackground } from '../utils/useLqipBackground'

import '../styles/background.css'

type Slots = Record<'default', ComponentSlots['default']>
export type Props = ImageTransform

export const Background = createComponent({
  factory: async (result: SSRResult, props: Props, slots: Slots) => {
    const isDevelopment = import.meta.env.MODE === 'development'

    const { style: backgroundStyle } = await useLqipBackground({
      ...props,
      isDevelopment
    })

    const slotHtml = await renderSlotToString(result, slots.default)

    const wrapperAttributes: Record<string, string> = {
      style: backgroundStyle,
      'data-astro-lqip-bg': ''
    }

    return renderTemplate`
      <div ${spreadAttributes(wrapperAttributes)}>
        ${slotHtml}
      </div>
    `
  }
})
