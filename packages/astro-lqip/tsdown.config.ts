import { defineConfig } from 'tsdown'
import { rolldownPluginDtsMinifyLite } from 'rolldown-plugin-dts-minify-lite'

export default defineConfig({
  entry: './src/index.ts',
  target: 'node22',
  minify: true,
  css: {
    minify: true,
    fileName: 'astro-lqip.css',
    inject: true
  },
  deps: {
    neverBundle: 'astro:assets'
  },
  checks: {
    pluginTimings: false
  },
  plugins: [
    rolldownPluginDtsMinifyLite({
      keepJsDocs: true
    })
  ]
})
