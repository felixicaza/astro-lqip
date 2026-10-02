import { defineConfig } from 'astro/config'

export default defineConfig({
  compressHTML: false,
  image: {
    domains: ['images.pexels.com']
  }
})
