import { defineConfig } from 'astro/config'
import mdx from '@astrojs/mdx'

export default defineConfig({
  compressHTML: false,
  image: {
    domains: ['images.pexels.com']
  },
  integrations: [mdx()]
})
