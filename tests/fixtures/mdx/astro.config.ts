// @ts-check
import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

// https://astro.build/config
export default defineConfig({
  compressHTML: false,
  image: {
    domains: ['images.pexels.com']
  },
  integrations: [mdx()]
})
