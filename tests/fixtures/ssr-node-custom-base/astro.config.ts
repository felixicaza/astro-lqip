import { defineConfig } from 'astro/config'
import node from '@astrojs/node'

export default defineConfig({
  base: 'new-base',
  build: {
    assets: '_weird-name1'
  },
  adapter: node({
    mode: 'standalone'
  }),
  compressHTML: false,
  image: {
    domains: ['images.pexels.com']
  }
})
