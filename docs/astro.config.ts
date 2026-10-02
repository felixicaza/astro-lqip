import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://astro-lqip.web.app/',
  trailingSlash: 'never',
  image: {
    domains: ['images.pexels.com']
  }
})
