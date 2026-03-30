import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: 'src/index.ts',
  target: 'node22',
  minify: true,
  css: {
    minify: true,
    fileName: 'astro-lqip.css',
    inject: true
  },
  deps: {
    neverBundle: 'astro:assets'
  }
})
