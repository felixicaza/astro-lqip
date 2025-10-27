import { z, defineCollection } from 'astro:content'

const usageTips = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.number(),
    title: z.string(),
    isFullHeight: z.boolean().optional()
  })
})

export const collections = { usageTips }
