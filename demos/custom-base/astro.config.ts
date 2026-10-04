import { defineConfig } from 'astro/config'

export default defineConfig({
  base: 'new-base',
  build: {
    assets: '_weird-name1'
  },
  compressHTML: false,
  image: {
    domains: ['images.pexels.com']
  }
})
