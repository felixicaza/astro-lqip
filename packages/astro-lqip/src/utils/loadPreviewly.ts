import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

type PreviewlyModule = typeof import('previewly')

let previewlyModulePromise: Promise<PreviewlyModule> | undefined

export function loadPreviewly(): Promise<PreviewlyModule> {
  previewlyModulePromise ||= (async() => {
    const astroLqipEntry = import.meta.resolve('astro-lqip')
    const requireFromAstroLqip = createRequire(astroLqipEntry)
    const previewlyEntry = requireFromAstroLqip.resolve('previewly')

    // SAFETY: `previewlyEntry` resolves the installed `previewly` package, whose declared module type is `PreviewlyModule`
    return import(pathToFileURL(previewlyEntry).href) as Promise<PreviewlyModule>
  })()

  return previewlyModulePromise
}
