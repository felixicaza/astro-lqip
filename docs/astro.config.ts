// @ts-check
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://astro-lqip.web.app/',
  trailingSlash: 'never',
  image: {
    domains: ['images.pexels.com']
  }
})
