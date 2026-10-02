import type { ImageMetadata } from 'astro'

export type ResolvedImage = ImageMetadata

export type ResolvedImageSource =
  | { kind: 'remote'; astroSrc: string; lqipInput: { src: string } }
  | { kind: 'local'; astroSrc: ResolvedImage; lqipInput: ResolvedImage }

export interface ImportModule { default: ResolvedImage }
export type ImagePath = string | ResolvedImage | Promise<ImportModule>
export type GlobMap = Record<string, () => Promise<ImportModule>>
