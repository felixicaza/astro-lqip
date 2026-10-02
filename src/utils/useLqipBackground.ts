import type { ImageMetadata } from 'astro'
import type { ImageTransform, ResolvedImage } from '../types/index.ts'

import { getImage, inferRemoteSize } from 'astro:assets'

import { resolveLqipImageSource } from './resolveImagePath.ts'
import { getLqip } from './getLqip.ts'
import { PREFIX } from '../constants/index.ts'

interface SourceEntry {
  url: string
  width?: number
}

interface FormatSourceSet {
  format: string
  mimeType: string
  fallbackSrc: string
  sources: SourceEntry[]
}

type FormatSelector = (formatSource: FormatSourceSet) => SourceEntry | undefined

interface BuildResponsiveBackgroundStyleOptions {
  referenceSources: SourceEntry[]
  baseVariable: string
  createValue: (selector?: FormatSelector) => string
}

interface CreateBackgroundValueOptions {
  formatSources: FormatSourceSet[]
  optimizedImages: Awaited<ReturnType<typeof getImage>>[]
  isFormatArray: boolean
  selector?: FormatSelector
  layer?: string
}

interface ResolvedBackgroundSource {
  resolvedSrc: string | ResolvedImage
  lqipInput: { src: string }
  width?: number
  height?: number
}

const WIDTH_REGEX = /(?<value>\d+(?:\.\d+)?)(?<unit>[wx])/i

function normalizeCssVariableName(variable: string) {
  const trimmed = variable.trim()
  if (!trimmed) return '--background'
  return trimmed.startsWith('--') ? trimmed : `--${trimmed}`
}

function normalizeFormatValue(value: string) {
  return value.trim().toLowerCase()
}

function sortFormats(values: string[]) {
  const formatPriority = ['avif', 'webp', 'png', 'jpeg', 'jpg', 'svg']
  const seen = new Set<string>()

  const unique = values.reduce<string[]>((formats, value) => {
    const normalized = normalizeFormatValue(value)

    if (!normalized || seen.has(normalized)) return formats

    seen.add(normalized)
    formats.push(normalized)
    return formats
  }, [])

  return unique.sort((a, b) => {
    const priorityA = formatPriority.indexOf(a)
    const priorityB = formatPriority.indexOf(b)
    const normalizedA = priorityA === -1 ? Number.MAX_SAFE_INTEGER : priorityA
    const normalizedB = priorityB === -1 ? Number.MAX_SAFE_INTEGER : priorityB

    if (normalizedA === normalizedB) return a.localeCompare(b)

    return normalizedA - normalizedB
  })
}

function getTargetFormats(format: UseLqipBackgroundOptions['format']) {
  let formatValues: string[]

  if (format === undefined) {
    formatValues = []
  } else if (Array.isArray(format)) {
    formatValues = format
  } else {
    formatValues = [format]
  }

  const normalizedFormats = sortFormats(formatValues)

  return {
    formats: normalizedFormats.length ? normalizedFormats : ['webp'],
    isFormatArray: Array.isArray(format)
  }
}

async function resolveBackgroundSource(
  src: UseLqipBackgroundOptions['src'],
  width?: number,
  height?: number
): Promise<ResolvedBackgroundSource> {
  let normalizedWidth = width
  let normalizedHeight = height

  const source = await resolveLqipImageSource(src)
  if (!source) throw new Error(`${PREFIX} Could not resolve background image`)

  const resolvedSrc = source.astroSrc
  const remoteBackgroundUrl = source.kind === 'remote' ? source.astroSrc : undefined

  if (remoteBackgroundUrl && (!normalizedWidth || !normalizedHeight)) {
    try {
      const inferredSize = await inferRemoteSize(remoteBackgroundUrl)
      normalizedWidth ??= inferredSize.width
      normalizedHeight ??= inferredSize.height
    } catch(error) {
      console.warn(`${PREFIX} Failed to infer remote background size for "${remoteBackgroundUrl}".`, error)
    }

    if (!normalizedWidth || !normalizedHeight) {
      throw new Error(
        `${PREFIX} Remote background images require 'width' and 'height'. Provide both props or ensure the URL is reachable in your Astro config 'image.domains'.`
      )
    }
  }

  return {
    resolvedSrc,
    lqipInput: source.lqipInput,
    width: normalizedWidth,
    height: normalizedHeight
  }
}

function mimeTypeFromFormat(value: string) {
  switch (value) {
    case 'avif':
      return 'image/avif'
    case 'webp':
      return 'image/webp'
    case 'png':
      return 'image/png'
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg'
    case 'svg':
      return 'image/svg+xml'
    default:
      return `image/${value}`
  }
}

function parseSrcSetAttribute(attribute?: string): SourceEntry[] {
  if (!attribute) return []

  const entries = attribute
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const lastSpaceIndex = entry.lastIndexOf(' ')
      if (lastSpaceIndex === -1) return { url: entry } satisfies SourceEntry

      const url = entry.slice(0, lastSpaceIndex)
      const descriptor = entry.slice(lastSpaceIndex + 1)
      const widthMatch = descriptor.match(WIDTH_REGEX)
      const width = widthMatch?.groups?.unit?.toLowerCase() === 'w' ? Number(widthMatch.groups.value) : undefined

      return { url, width }
    })

  const unique = new Map(entries.map((entry) => [entry.url, entry]))
  return [...unique.values()].sort((a, b) => (a.width ?? 0) - (b.width ?? 0))
}

function buildResponsiveBackgroundStyle({ referenceSources, baseVariable, createValue }: BuildResponsiveBackgroundStyleOptions) {
  if (!referenceSources.length) return `${baseVariable}: ${createValue()}`

  const declarations = [`${baseVariable}: ${createValue((formatSource) => formatSource.sources.at(-1))}`]

  const buckets = [
    { suffix: '-small', match: (width?: number) => width !== undefined && width < 768 },
    { suffix: '-medium', match: (width?: number) => width !== undefined && width >= 768 && width <= 1200 },
    { suffix: '-large', match: (width?: number) => width !== undefined && width > 1200 && width <= 1920 },
    { suffix: '-xlarge', match: (width?: number) => width !== undefined && width > 1920 }
  ] as const

  for (const bucket of buckets) {
    const referenceMatch = referenceSources.toReversed().find((source) => bucket.match(source.width))
    if (!referenceMatch || referenceMatch.width === undefined) continue

    const value = createValue((formatSource) => formatSource.sources.find((source) => source.width === referenceMatch.width))
    declarations.push(`${baseVariable}${bucket.suffix}: ${value}`)
  }

  return declarations.join('; ')
}

function selectSourceOrFallback(formatSource: FormatSourceSet, selector?: FormatSelector) {
  return selector?.(formatSource) ?? formatSource.sources.at(-1) ?? { url: formatSource.fallbackSrc }
}

function appendLqipLayer(baseValue: string, layer?: string) {
  if (baseValue && layer) return `${baseValue}, ${layer}`
  return baseValue || layer || ''
}

function createBackgroundValue({
  formatSources,
  optimizedImages,
  isFormatArray,
  selector,
  layer
}: CreateBackgroundValueOptions) {
  if (!formatSources.length) {
    const fallbackSrc = optimizedImages[0]?.src ?? ''
    const baseValue = fallbackSrc ? `url('${fallbackSrc}')` : ''
    return appendLqipLayer(baseValue, layer)
  }

  if (!isFormatArray) {
    const primary = formatSources[0]
    const selected = selectSourceOrFallback(primary, selector)
    const baseValue = `url('${selected.url ?? primary.fallbackSrc}')`
    return appendLqipLayer(baseValue, layer)
  }

  const parts = formatSources.map((formatSource) => {
    const selected = selectSourceOrFallback(formatSource, selector)
    const url = selected.url ?? formatSource.fallbackSrc
    return `url('${url}') type('${formatSource.mimeType}')`
  })

  return appendLqipLayer(`image-set(${parts.join(', ')})`, layer)
}

function formatLqipLayer(lqipType?: string, value?: string) {
  if (!lqipType || !value) return undefined
  if (lqipType === 'color') return `linear-gradient(${value}, ${value})`
  return `url("${value}")`
}

async function getLqipLayer(
  lqipInput: { src: string },
  lqip: NonNullable<UseLqipBackgroundOptions['lqip']>,
  isDevelopment: boolean
) {
  if (lqip === false) return undefined

  const lqipSize = 8
  const rawLqipValue = await getLqip(lqipInput, lqip, lqipSize, isDevelopment)
  // oxlint-disable-next-line anti-slop/no-runtime-typeof
  const value = typeof rawLqipValue === 'string' ? rawLqipValue : undefined

  return formatLqipLayer(lqip, value)
}

async function optimizeBackgroundImages({
  resolvedSrc,
  formats,
  width,
  height,
  widths,
  quality,
  fit
}: {
  resolvedSrc: string | ResolvedImage
  formats: string[]
  width?: number
  height?: number
  widths?: number[]
  quality?: ImageTransform['quality']
  fit?: ImageTransform['fit']
}) {
  const imageInput: string | ImageMetadata = resolvedSrc
  const imageOptions = { src: imageInput, widths, width, height, quality, fit }
  return Promise.all(formats.map((currentFormat) => getImage({ ...imageOptions, format: currentFormat })))
}

function createFormatSources(optimizedImages: Awaited<ReturnType<typeof getImage>>[], formats: string[]): FormatSourceSet[] {
  return optimizedImages.map((optimizedImage, index) => ({
    format: formats[index],
    mimeType: mimeTypeFromFormat(formats[index]),
    fallbackSrc: optimizedImage.src,
    sources: parseSrcSetAttribute(optimizedImage.srcSet?.attribute)
  }))
}

function createBackgroundStyle({
  cssVariable,
  widths,
  lqip,
  lqipLayer,
  formatSources,
  optimizedImages,
  isFormatArray
}: {
  cssVariable: string
  widths?: number[]
  lqip: UseLqipBackgroundOptions['lqip']
  lqipLayer?: string
  formatSources: FormatSourceSet[]
  optimizedImages: Awaited<ReturnType<typeof getImage>>[]
  isFormatArray: boolean
}) {
  const baseVariable = normalizeCssVariableName(cssVariable)
  const referenceSources = formatSources[0]?.sources ?? []
  const createValue = (selector?: FormatSelector) =>
    createBackgroundValue({
      formatSources,
      optimizedImages,
      isFormatArray,
      selector,
      layer: lqip === false ? undefined : lqipLayer
    })

  if (!Array.isArray(widths) || widths.length === 0) return `${baseVariable}: ${createValue()}`

  return buildResponsiveBackgroundStyle({ referenceSources, baseVariable, createValue })
}

export async function useLqipBackground({
  src,
  cssVariable = '--background',
  format = 'webp',
  widths,
  width,
  height,
  quality,
  fit,
  lqip = 'base64',
  isDevelopment
}: UseLqipBackgroundOptions) {
  const { resolvedSrc, lqipInput, width: normalizedWidth, height: normalizedHeight } = await resolveBackgroundSource(src, width, height)

  const lqipLayer = await getLqipLayer(lqipInput, lqip, isDevelopment)
  const { formats, isFormatArray } = getTargetFormats(format)

  const optimizedImages = await optimizeBackgroundImages({
    resolvedSrc,
    formats,
    widths,
    width: normalizedWidth,
    height: normalizedHeight,
    quality,
    fit
  })

  const formatSources = createFormatSources(optimizedImages, formats)
  const style = createBackgroundStyle({
    cssVariable,
    widths,
    lqip,
    lqipLayer,
    formatSources,
    optimizedImages,
    isFormatArray
  })

  return { style, resolvedSrc }
}

export type UseLqipBackgroundOptions = ImageTransform & {
  cssVariable?: string
  lqip?: 'base64' | 'color' | false
  isDevelopment: boolean
}
