// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  base: 'new-base',
  build: {
    assets: '_weird-name1'
  },
  compressHTML: false
})
