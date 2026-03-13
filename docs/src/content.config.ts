import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'astro/zod'

const usageTips = defineCollection({
  loader: glob({ base: './src/content/usageTips', pattern: '**/*.md' }),
  schema: z.object({
    id: z.number(),
    title: z.string(),
    isFullHeight: z.boolean().optional()
  })
})

export const collections = { usageTips }
